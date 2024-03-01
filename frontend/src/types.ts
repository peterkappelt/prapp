import { z } from "zod";
import {
  Process as ApiProcess,
  ProcessRequest as ApiProcessRequest,
  Step as ApiStep,
  Meta as ApiMeta,
  ProcessExecution as ApiProcessExecution,
  StepExecution as ApiStepExecution,
} from "./api";

const uuid4 = () => crypto.randomUUID();

const Section = z.object({
  id: z.string().default(uuid4),
  type: z.literal("SE"),
  title: z.string(),
});
const Section_Empty = () => Section.parse({ type: "SE", title: "" });
type TSection = z.infer<typeof Section>;

const Step = z.object({
  id: z.string().default(uuid4),
  type: z.literal("ST"),
  title: z.string(),
  description: z.string().default(""),
});
const Step_Empty = () =>
  Step.parse({
    type: "ST",
    title: "",
  });
type TStep = z.infer<typeof Step>;

const Process_StepItem = z.union([Section, Step]) satisfies z.ZodType<ApiStep>;
type TProcess_StepItem = z.infer<typeof Process_StepItem>;

const ProcessMeta = z.object({
  id: z.string(),
  createdBy: z.number(),
  createdAt: z.date(),
}) satisfies z.ZodType<ApiMeta>;

const Process = z.object({
  title: z.string(),
  steps: z.array(Process_StepItem),
  meta: ProcessMeta.optional(),
  revision: z.string().uuid().optional(),
  createdAt: z.date().optional(),
}) satisfies z.ZodType<ApiProcessRequest & Partial<ApiProcess>>;
type TProcess = z.infer<typeof Process>;

const Process_Empty = Process.parse({
  title: "",
  steps: [Section_Empty(), Step_Empty()],
});

const StepExecutionMeta = z.object({
  startedAt: z.date().nullable(),
  startedBy: z.number().nullable(),
  doneAt: z.date().nullable(),
  doneBy: z.number().nullable(),
  state: z.union([z.literal("active"), z.literal("done")]).optional(),
});

const SectionExecution = Section.merge(StepExecutionMeta);
type TSectionExecution = z.infer<typeof SectionExecution>;

const StepExecution = Step.merge(StepExecutionMeta);
type TStepExecution = z.infer<typeof StepExecution>;

const Process_StepItemExecution = z.union([
  // TODO section is actually guaranteed to not have execution meta,
  // but we need to have it here to satisfy type definitions
  SectionExecution,
  StepExecution,
]) satisfies z.ZodType<ApiStepExecution>;

const ProcessExecution = Process.merge(
  z.object({
    steps: z.array(Process_StepItemExecution),
    revision: z.string().uuid(),
    createdAt: z.date(),
    meta: ProcessMeta,
  })
) satisfies z.ZodType<ApiProcessExecution>;
type TProcessExecution = z.infer<typeof ProcessExecution>;

export {
  Process,
  Process_Empty,
  Step,
  Step_Empty,
  Section,
  Section_Empty,
  ProcessExecution,
};
export type {
  TProcess,
  TStep,
  TSection,
  TProcess_StepItem,
  TProcessExecution,
  TStepExecution,
  TSectionExecution,
};
