import {
  Step_Empty,
  TProcess_StepItem,
  TSection,
  TSectionExecution,
  TStep,
  TStepExecution,
} from "@/newtypes";
import {
  ActionIcon,
  Button,
  Group,
  Stack,
  TextInput,
  Timeline,
  TimelineItemProps,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import React, { useCallback } from "react";
import { ProcessStep } from "./ProcessStep";

interface ProcessSectionProps<T extends TStep = TStep> {
  section: TSection;
  steps: T[];
  title?: React.ReactNode;
  timelineItemProps?: TimelineItemProps;
  children?: (step: T, step_idx: number) => React.ReactNode;
  extraChildren?: React.ReactNode | React.ReactNode[];
}

interface ProcessSectionEditableProps extends ProcessSectionProps {
  mutator: (func: (steps: TProcess_StepItem[]) => undefined) => void;
  onSectionAdd: () => void;
  onDelete: () => void;
}

interface ProcessSectionExecutionProps
  extends ProcessSectionProps<TStepExecution> {
  section: TSectionExecution;
  onStepStart: (stepId: string) => void;
  onStepDone: (stepId: string) => void;
}

function ProcessSectionExecution({
  section,
  onStepStart,
  onStepDone,
  ...props
}: ProcessSectionExecutionProps) {
  return (
    <ProcessSection
      // overwriting the internal __active and __lineActive props is dirty,
      // but I don't know a better way yet since Timeline requires Timeline.Item
      // to be a direct child
      timelineItemProps={{
        __active: section.state == "active" || section.state == "done",
        __lineActive: section.state == "done",
        color: section.state == "done" ? "green" : undefined,
      }}
      section={section}
      {...props}
    >
      {(step) => (
        <ProcessStep.Execution
          step={step}
          onStart={() => onStepStart(step.id)}
          onDone={() => onStepDone(step.id)}
        />
      )}
    </ProcessSection>
  );
}

function ProcessSectionEditable({
  mutator,
  onSectionAdd,
  onDelete,
  ...props
}: ProcessSectionEditableProps) {
  const handleTitleChange = useCallback(
    (title: string) => {
      mutator((draft) => {
        draft.find((s) => s.id == props.section.id)!.title = title;
      });
    },
    [mutator, props.section.id]
  );

  return (
    <ProcessSection
      title={
        <TextInput
          size="md"
          placeholder="Section Title"
          value={props.section.title}
          onChange={(e) => handleTitleChange(e.currentTarget.value)}
          rightSection={
            <Tooltip label="This will delete all steps within the section as well">
              <ActionIcon variant="default" onClick={onDelete}>
                <IconTrash
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
          }
        />
      }
      extraChildren={
        <AddButtons
          onSectionAdd={onSectionAdd}
          onStepAdd={() =>
            mutator((draft) => {
              let idx = draft.findIndex((s) => s.id == props.section.id);
              do {
                idx++;
                if (idx == draft.length) break;
                if (draft[idx].type == "SE") break;
              } while (idx < draft.length);
              draft.splice(idx, 0, Step_Empty());
            })
          }
        />
      }
      {...props}
    >
      {(step) => (
        <ProcessStep.Editable
          step={step}
          mutator={(update) =>
            mutator((draft) => {
              update(draft.find((s) => s.id == step.id) as TStep);
            })
          }
          onDelete={() =>
            mutator((draft) => {
              const idx = draft.findIndex((s) => s.id == step.id);
              if (idx == -1) return;
              draft.splice(idx, 1);
            })
          }
        />
      )}
    </ProcessSection>
  );
}

function ProcessSection<T extends TStep>({
  section,
  steps,
  timelineItemProps,
  title,
  children,
  extraChildren,
}: ProcessSectionProps<T>) {
  return (
    <Timeline.Item
      title={title ?? <Title order={2}>{section.title}</Title>}
      {...timelineItemProps}
    >
      <Stack gap="sm" mt="md">
        {steps.map((step, step_idx) =>
          children ? (
            <React.Fragment key={step.id}>
              {children(step, step_idx)}
            </React.Fragment>
          ) : (
            <ProcessStep key={step.id} step={step} />
          )
        )}
        <React.Fragment key="__extra">{extraChildren}</React.Fragment>
      </Stack>
    </Timeline.Item>
  );
}

function AddButtons({
  onSectionAdd,
  onStepAdd,
}: {
  onSectionAdd: () => void;
  onStepAdd: () => void;
}) {
  return (
    <Group justify="center">
      <Button
        variant="light"
        leftSection={<IconPlus size={14} />}
        onClick={onSectionAdd}
      >
        Section
      </Button>
      <Button
        variant="light"
        leftSection={<IconPlus size={14} />}
        onClick={onStepAdd}
      >
        Step
      </Button>
    </Group>
  );
}

ProcessSection.Editable = ProcessSectionEditable;
ProcessSection.Execution = ProcessSectionExecution;

export { ProcessSection };
