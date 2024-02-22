import { DocumentData, DocumentReference } from "firebase/firestore";
import { z } from "zod";

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
  startedAt: z.date(),
  doneAt: z.date().optional(),
});

const ProcessExecution = z.object({
  initiatedAt: z.date(),
  steps: z.array(ExecutionStepMeta),
  processRef: z
    .object({})
    .refine(
      (x: object): x is DocumentReference<TTemplateProcess, DocumentData> =>
        x instanceof DocumentReference
    ),
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
  TProcessExecution,
};
