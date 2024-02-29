import { Section_Empty, TProcess, TSection, TStep } from "@/newtypes";
import { TProcessExecution } from "@/types";
import { TextInput, Timeline, TimelineProps, Title } from "@mantine/core";
import React, { useCallback, useMemo } from "react";
import { ProcessSection } from "./ProcessSection";

interface ProcessViewProps<T extends TProcess = TProcess> {
  process: T;
  title?: React.ReactNode;
  timelineProps?: TimelineProps;
  children?: (section: TSection, steps: TStep[]) => React.ReactNode;
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
      {(sec) => (
        <ProcessSection.Execution
          key={sec.id}
          section={sec}
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

type SplitSteps = [TSection, TStep[]][];

function ProcessView<T extends TProcess>({
  process,
  timelineProps,
  title,
  children,
}: ProcessViewProps<T>) {
  const structured = useMemo<SplitSteps>(() => {
    const steps = process.steps;
    const res: SplitSteps = [];

    if (steps.length == 0) return [];
    if (steps[0].type != "SE") throw new Error("First step must be section");

    let currentSec: TSection = steps[0];
    let currentSteps: TStep[] = [];

    for (let i = 1; i < steps.length; i++) {
      const step = steps[i];
      if (step.type == "SE") {
        res.push([currentSec, currentSteps]);
        currentSec = step;
        currentSteps = [];
      } else {
        currentSteps.push(step);
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
