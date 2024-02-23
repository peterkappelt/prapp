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

const ProcessExecutionStepInfo = z.object({
  startedAt: z.custom<Timestamp>().optional(),
  doneAt: z.custom<Timestamp>().optional(),
});
type TProcessExecutionStepInfo = z.infer<typeof ProcessExecutionStepInfo>;

const ProcessExecution = ProcessExecutionDTO.merge(TemplateProcess).merge(
  z.object({
    activeSectionIdx: z.number(),
    activeStepIdx: z.number(),
    stepInfo: z.record(z.string().uuid(), ProcessExecutionStepInfo),
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
};
export type {
  TTemplateProcess,
  TTemplateSection,
  TTemplateStep,
  TProcessExecutionDTO,
  TProcessExecution,
  THistoryItem,
  TProcessExecutionStepInfo,
};
