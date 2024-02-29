import {
  CollectionReference,
  DocumentReference,
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import {
  THistoryItem,
  TProcessExecutionDTO,
  TTemplateMeta,
  TTemplateProcess,
} from "../types";
import { app } from "./conf";
import { auth } from "./auth";

type TCollectionReference_TemplateMeta = CollectionReference<TTemplateMeta>;
type TCollectionReference_TemplateProcess =
  CollectionReference<TTemplateProcess>;
type TCollectionReference_ProcessExecution =
  CollectionReference<TProcessExecutionDTO>;
type TCollectionReference_HistoryItem = CollectionReference<THistoryItem>;

type TDocumentReference_TemplateMeta = DocumentReference<TTemplateMeta>;
type TDocumentReference_TemplateProcess = DocumentReference<TTemplateProcess>;
type TDocumentReference_ProcessExecution =
  DocumentReference<TProcessExecutionDTO>;

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const collections = {
  templateProcesses: () =>
    collection(db, "TemplateProcesses") as TCollectionReference_TemplateMeta,
  /** Schema: TemplateProcesses/<id of the template>/Revisions/<random firebase id> => TTemplateProcess*/
  templateProcessRevisions: (templateId: string) =>
    collection(
      db,
      "TemplateProcesses",
      templateId,
      "Revisions"
    ) as TCollectionReference_TemplateProcess,
  execution: collection(db, "Exec") as TCollectionReference_ProcessExecution,
  executionHistory: (executionId: string) =>
    collection(
      db,
      "Exec",
      executionId,
      "History"
    ) as TCollectionReference_HistoryItem,
};

const docs = {
  templateMeta: (templateId: string) =>
    doc(db, "TemplateProcesses", templateId) as TDocumentReference_TemplateMeta,
  execution: (executionId: string) =>
    doc(db, "Exec", executionId) as TDocumentReference_ProcessExecution,
};

const queries = {
  getLatestTemplateProcessVersion: async (templateId: string) => {
    const res = await getDocs(
      query(
        collections.templateProcessRevisions(templateId),
        orderBy("createdAt", "desc"),
        limit(1)
      )
    );
    if (res.empty) return;
    return res.docs[0];
  },
  getAvailableTemplates: async () => {
    const res = await getDocs(query(collections.templateProcesses()));
    return res;
  },
  getExecutionsForProcess: async (
    templateId: string
  ): Promise<[string, TProcessExecutionDTO][]> => {
    const templateRevs = await getDocs(
      query(collections.templateProcessRevisions(templateId))
    );
    const templateRevRefs = templateRevs.docs.map((d) => d.ref);
    const res = await getDocs(
      query(
        collections.execution,
        where("processRef", "in", templateRevRefs),
        orderBy("initiatedAt", "desc")
      )
    );
    return res.docs.map((d) => [d.id, d.data()]);
  },
};

const actions = {
  storeProcessRevision: async (
    templateId: string,
    process: TTemplateProcess
  ) => {
    const res = await addDoc(collections.templateProcessRevisions(templateId), {
      ...process,
      createdAt: serverTimestamp(),
    });
    return res;
  },
  startProcessExecution: async (
    processRef: TDocumentReference_TemplateProcess
  ) => {
    return await addDoc(collections.execution, {
      processRef,
      initiatedAt: serverTimestamp(),
      initiatedBy: auth.currentUser?.uid,
    });
  },
  historyMarkStepAs: async (
    executionId: string,
    stepId: string,
    as: "step_started" | "step_done"
  ) => {
    addDoc(collections.executionHistory(executionId), {
      type: as,
      step: stepId,
      at: serverTimestamp(),
      by: auth.currentUser?.uid,
    });
  },
};

export { db, collections, docs, queries, actions };

export type {
  TCollectionReference_ProcessExecution,
  TCollectionReference_TemplateProcess,
  TDocumentReference_ProcessExecution,
  TDocumentReference_TemplateProcess,
};