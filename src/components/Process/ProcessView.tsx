import {
  TProcessExecution,
  TTemplateProcess,
  TTemplateSection,
  TemplateSection,
} from "@/types";
import { TextInput, Timeline, TimelineProps, Title } from "@mantine/core";
import React, { useCallback, useMemo } from "react";
import { ProcessSection } from "./ProcessSection";

interface ProcessViewProps {
  process: TTemplateProcess;
  title?: React.ReactNode;
  timelineProps?: TimelineProps;
  children?: (
    section: TTemplateSection,
    section_idx: number
  ) => React.ReactNode;
}

interface ProcessViewEditableProps extends ProcessViewProps {
  mutator: (func: (section: TTemplateProcess) => undefined) => void;
}

interface ProcessViewExecutionProps extends ProcessViewProps {
  execution: Omit<TProcessExecution, "processRef">;
  onStepStart: (stepId: string) => void;
  onStepDone: (stepId: string) => void;
}

function ProcessViewExecution({
  execution,
  onStepStart,
  onStepDone,
  ...props
}: ProcessViewExecutionProps) {
  // TODO I don't like how bulky this is
  const [activeSection, activeStep] = useMemo(() => {
    // create an array [sec_idx][step_idx] = execution_step_id | undefined
    const stepExecutionIds = props.process.sections.map((sec) =>
      sec.steps.map((step) =>
        step.id in execution.steps ? step.id : undefined
      )
    );
    // create an array [sec_idx][step_idx] = done?
    // => it is done when the execution has both startedAt and doneAt properties set
    const stepsDone = stepExecutionIds.map((sec) =>
      sec.map(
        (step) =>
          step &&
          execution.steps[step].startedAt &&
          execution.steps[step].doneAt
      )
    );

    // create an array [sec_idx] = first_unfinished_step_idx
    const firstUnfinishedStepPerSection = stepsDone.map((step) =>
      step.findIndex((s) => !s)
    );

    // determine the first sec_idx, where there is an unfinished step
    const firstUnfinishedSection = firstUnfinishedStepPerSection.findIndex(
      (s) => s != -1
    );

    if (firstUnfinishedSection == -1) return [0, 0];
    return [
      firstUnfinishedSection,
      firstUnfinishedStepPerSection[firstUnfinishedSection],
    ];
  }, [execution.steps, props.process.sections]);

  return (
    <ProcessView {...props}>
      {(sec, sec_idx) => (
        <ProcessSection.Execution
          key={sec.id}
          activeStep={activeStep}
          isActive={activeSection == sec_idx}
          isCompleted={activeSection > sec_idx}
          section={sec}
          execution={execution}
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
      {(sec, sec_idx) => (
        <ProcessSection.Editable
          section={sec}
          mutator={(u) => {
            mutator((draft) => u(draft.sections[sec_idx]));
          }}
          onDelete={() =>
            mutator((draft) => {
              draft.sections.splice(sec_idx, 1);
            })
          }
          onSectionAdd={() =>
            mutator((draft) => {
              draft.sections.splice(sec_idx + 1, 0, TemplateSection.parse({}));
            })
          }
        />
      )}
    </ProcessView>
  );
}

function ProcessView({
  process,
  timelineProps,
  title,
  children,
}: ProcessViewProps) {
  return (
    <>
      {title ?? <Title order={1}>{process.title}</Title>}
      <Timeline lineWidth={3} bulletSize={40} active={0} {...timelineProps}>
        {process.sections.map((sec, sec_idx) =>
          children ? (
            <React.Fragment key={sec.id}>
              {children(sec, sec_idx)}
            </React.Fragment>
          ) : (
            <ProcessSection key={sec.id} section={sec} />
          )
        )}
      </Timeline>
    </>
  );
}

ProcessView.Editable = ProcessViewEditable;
ProcessView.Execution = ProcessViewExecution;

export { ProcessView };
