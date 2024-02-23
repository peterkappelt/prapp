import { Timestamp } from "firebase/firestore";
import { z } from "zod";
import { TDocumentReference_TemplateProcess } from "./db";

const uuid4 = () => crypto.randomUUID();

const TemplateStep = z.object({
  id: z.string().uuid().default(uuid4),
  title: z.string().max(200).trim().default(""),
  description: z.string().default(""),
});
type TTemplateStep = z.infer<typeof TemplateStep>;

const TemplateSection = z.object({
  id: z.string().uuid().default(uuid4),
  title: z.string().max(200).trim().default(""),
  steps: z.array(TemplateStep).default(() => [TemplateStep.parse({})]),
});
type TTemplateSection = z.infer<typeof TemplateSection>;

const TemplateProcess = z.object({
  id: z.string().uuid().default(uuid4),
  title: z.string().max(200).trim().default(""),
  sections: z.array(TemplateSection).default(() => [TemplateSection.parse({})]),
  createdAt: z.date().optional(),
});
type TTemplateProcess = z.infer<typeof TemplateProcess>;

const ExecutionStepMeta = z.object({
  startedAt: z.custom<Timestamp>().optional(),
  doneAt: z.custom<Timestamp>().optional(),
});
type TExecutionStepMeta = z.infer<typeof ExecutionStepMeta>;

const ProcessExecution = z.object({
  initiatedAt: z.custom<Timestamp>(),
  steps: z.record(z.string().uuid(), ExecutionStepMeta),
  processRef: z.custom<TDocumentReference_TemplateProcess>(),
});
type TProcessExecution = z.infer<typeof ProcessExecution>;

export {
  TemplateProcess,
  TemplateSection,
  TemplateStep,
  ProcessExecution,
  ExecutionStepMeta,
};
export type {
  TTemplateProcess,
  TTemplateSection,
  TTemplateStep,
  TExecutionStepMeta,
  TProcessExecution,
};
