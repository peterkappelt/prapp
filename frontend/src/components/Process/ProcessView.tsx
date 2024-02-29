import { Section_Empty, TProcess, TProcessExecution } from "@/newtypes";
import { TextInput, Timeline, TimelineProps, Title } from "@mantine/core";
import React, { useCallback, useMemo } from "react";
import { ProcessSection } from "./ProcessSection";

type TProcess_SectionType<T extends TProcess> = Extract<
  T["steps"][0],
  { type: "SE" }
>;
type TProcess_StepType<T extends TProcess> = Extract<
  T["steps"][0],
  { type: "ST" }
>;

interface ProcessViewProps<T extends TProcess = TProcess> {
  process: T;
  title?: React.ReactNode;
  timelineProps?: TimelineProps;
  children?: (
    section: TProcess_SectionType<T>,
    steps: TProcess_StepType<T>[]
  ) => React.ReactNode;
}

interface ProcessViewEditableProps extends ProcessViewProps {
  mutator: (func: (process: TProcess) => undefined) => void;
}

interface ProcessViewExecutionProps
  extends ProcessViewProps<TProcessExecution> {
  onStepStart: (stepId: string) => void;
  onStepDone: (stepId: string) => void;
}

function ProcessViewExecution({
  onStepStart,
  onStepDone,
  process,
  ...props
}: ProcessViewExecutionProps) {
  return (
    <ProcessView process={process} {...props}>
      {(sec, steps) => (
        <ProcessSection.Execution
          key={sec.id}
          section={sec}
          steps={steps}
          onStepDone={onStepDone}
          onStepStart={onStepStart}
        />
      )}
    </ProcessView>
  );
}

function ProcessViewEditable({ mutator, ...props }: ProcessViewEditableProps) {
  const handleTitleChange = useCallback(
    (title: string) => {
      mutator((draft) => {
        draft.title = title;
      });
    },
    [mutator]
  );

  return (
    <ProcessView
      title={
        <TextInput
          size="lg"
          value={props.process.title}
          onChange={(e) => handleTitleChange(e.currentTarget.value)}
          placeholder="Process Title"
        />
      }
      {...props}
    >
      {(sec, steps) => (
        <ProcessSection.Editable
          section={sec}
          steps={steps}
          mutator={(u) => {
            mutator((draft) => u(draft.steps));
          }}
          onDelete={() =>
            mutator((draft) => {
              const idx = draft.steps.findIndex((s) => s.id == sec.id);
              if (idx == -1) return;
              draft.steps.splice(idx, 1);
            })
          }
          onSectionAdd={() =>
            mutator((draft) => {
              let idx = draft.steps.findIndex((s) => s.id == sec.id);
              while (idx < draft.steps.length) {
                idx++;
                if (idx == draft.steps.length) break;
                if (draft.steps[idx].type == "SE") break;
              }
              draft.steps.splice(idx, 0, Section_Empty());
            })
          }
        />
      )}
    </ProcessView>
  );
}

function ProcessView<T extends TProcess>({
  process,
  timelineProps,
  title,
  children,
}: ProcessViewProps<T>) {
  type SplitSteps = [TProcess_SectionType<T>, TProcess_StepType<T>[]][];

  const structured = useMemo<SplitSteps>(() => {
    const steps = process.steps;
    const res: SplitSteps = [];

    if (steps.length == 0) return [];
    if (steps[0].type != "SE") throw new Error("First step must be section");

    // TODO those explicit as-castings should not be necessary and I don't know why they are
    let currentSec: TProcess_SectionType<T> =
      steps[0] as TProcess_SectionType<T>;
    let currentSteps: TProcess_StepType<T>[] = [];

    for (let i = 1; i < steps.length; i++) {
      const step = steps[i];
      if (step.type == "SE") {
        res.push([currentSec, currentSteps]);
        currentSec = step as TProcess_SectionType<T>;
        currentSteps = [];
      } else {
        currentSteps.push(step as TProcess_StepType<T>);
      }
    }
    res.push([currentSec, currentSteps]);
    return res;
  }, [process.steps]);

  return (
    <>
      {title ?? <Title order={1}>{process.title}</Title>}
      <Timeline lineWidth={3} bulletSize={40} active={0} {...timelineProps}>
        {structured.map(([sec, steps]) =>
          children ? (
            <React.Fragment key={sec.id}>{children(sec, steps)}</React.Fragment>
          ) : (
            <ProcessSection key={sec.id} section={sec} steps={steps} />
          )
        )}
      </Timeline>
    </>
  );
}

ProcessView.Editable = ProcessViewEditable;
ProcessView.Execution = ProcessViewExecution;

export { ProcessView };
