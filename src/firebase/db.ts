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
} from "firebase/firestore";
import { THistoryItem, TProcessExecutionDTO, TTemplateProcess } from "../types";
import { app } from "./conf";

type TCollectionReference_TemplateProcess =
  CollectionReference<TTemplateProcess>;
type TCollectionReference_ProcessExecution =
  CollectionReference<TProcessExecutionDTO>;
type TCollectionReference_HistoryItem = CollectionReference<THistoryItem>;

type TDocumentReference_TemplateProcess = DocumentReference<TTemplateProcess>;
type TDocumentReference_ProcessExecution =
  DocumentReference<TProcessExecutionDTO>;

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const collections = {
  templateProcesses: () => collection(db, "TemplateProcesses"),
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
    console.log(res.docs);
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
