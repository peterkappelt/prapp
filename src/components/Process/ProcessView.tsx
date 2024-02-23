import {
  TProcessExecution,
  TTemplateProcess,
  TTemplateSection,
  TemplateSection,
} from "@/types";
import { TextInput, Timeline, TimelineProps, Title } from "@mantine/core";
import React, { useCallback } from "react";
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
  process: TProcessExecution;
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
      {(sec, sec_idx) => (
        <ProcessSection.Execution
          key={sec.id}
          activeStep={process.activeStepIdx}
          isActive={process.activeSectionIdx == sec_idx}
          isCompleted={process.activeSectionIdx > sec_idx}
          section={sec}
          process={process}
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
