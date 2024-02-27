import { Timestamp } from "firebase/firestore";
import { z } from "zod";
import { TDocumentReference_TemplateProcess } from "./firebase/db";

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

const TemplateMeta = z.object({
  createdBy: z.string(),
  createdAt: z.custom<Timestamp>(),
});
type TTemplateMeta = z.infer<typeof TemplateMeta>;

const History_StepStarted = z.object({
  type: z.literal("step_started"),
  step: z.string().uuid(),
  at: z.custom<Timestamp>(),
});

const History_StepDone = z.object({
  type: z.literal("step_done"),
  step: z.string().uuid(),
  at: z.custom<Timestamp>(),
});

const HistoryItem = z.discriminatedUnion("type", [
  History_StepStarted,
  History_StepDone,
]);
type THistoryItem = z.infer<typeof HistoryItem>;

const ProcessExecutionDTO = z.object({
  initiatedAt: z.custom<Timestamp>(),
  processRef: z.custom<TDocumentReference_TemplateProcess>(),
});
type TProcessExecutionDTO = z.infer<typeof ProcessExecutionDTO>;

const ExecutionStep = TemplateStep.merge(
  z.object({
    state: z.union([z.literal("active"), z.literal("done")]).optional(),
    startedAt: z.custom<Timestamp>().optional(),
    doneAt: z.custom<Timestamp>().optional(),
  })
);
type TExecutionStep = z.infer<typeof ExecutionStep>;

const ExecutionSection = TemplateSection.merge(
  z.object({
    steps: z.array(ExecutionStep),
    state: z.union([z.literal("active"), z.literal("done")]).optional(),
  })
);
type TExecutionSection = z.infer<typeof ExecutionSection>;

const ProcessExecution = ProcessExecutionDTO.merge(TemplateProcess).merge(
  z.object({
    sections: z.array(ExecutionSection),
  })
);
type TProcessExecution = z.infer<typeof ProcessExecution>;

export {
  TemplateProcess,
  TemplateSection,
  TemplateStep,
  ProcessExecutionDTO,
  ProcessExecution,
  HistoryItem,
  TemplateMeta,
};
export type {
  TTemplateProcess,
  TTemplateSection,
  TTemplateStep,
  TProcessExecutionDTO,
  TProcessExecution,
  THistoryItem,
  TExecutionSection,
  TExecutionStep,
  TTemplateMeta,
};
