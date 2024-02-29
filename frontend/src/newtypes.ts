import { z } from "zod";
import {
  Process as ApiProcess,
  ProcessRequest as ApiProcessRequest,
  Step as ApiStep,
  Meta as ApiMeta,
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
}) satisfies z.ZodType<ApiProcessRequest & Partial<ApiProcess>>;
type TProcess = z.infer<typeof Process>;

const Process_Empty = Process.parse({
  title: "",
  steps: [Section_Empty(), Step_Empty()],
});

export { Process, Process_Empty, Step, Step_Empty, Section, Section_Empty };
export type { TProcess, TStep, TSection, TProcess_StepItem };
