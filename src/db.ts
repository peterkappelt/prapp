import { initializeApp } from "firebase/app";
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
import {
  THistoryItem,
  TProcessExecutionDTO,
  TTemplateProcess,
} from "./types";

type TCollectionReference_TemplateProcess =
  CollectionReference<TTemplateProcess>;
type TCollectionReference_ProcessExecution =
  CollectionReference<TProcessExecutionDTO>;
type TCollectionReference_HistoryItem = CollectionReference<THistoryItem>;

type TDocumentReference_TemplateProcess = DocumentReference<TTemplateProcess>;
type TDocumentReference_ProcessExecution =
  DocumentReference<TProcessExecutionDTO>;

const firebaseConfig = {
  apiKey: "AIzaSyBV2QeJYu44suzhebbPCyY6-LjQ3AFQ6EM",
  authDomain: "prapp-a04b0.firebaseapp.com",
  projectId: "prapp-a04b0",
  storageBucket: "prapp-a04b0.appspot.com",
  messagingSenderId: "997063427666",
  appId: "1:997063427666:web:908ef1c4c856d9ddbd018b",
};

const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const collections = {
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
