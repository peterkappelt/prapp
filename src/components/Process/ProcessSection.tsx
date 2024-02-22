import { TTemplateSection, TTemplateStep, TemplateStep } from "@/types";
import {
  ActionIcon,
  Button,
  Group,
  Stack,
  TextInput,
  Timeline,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import React, { useCallback } from "react";
import { ProcessStep } from "./ProcessStep";

interface ProcessSectionProps {
  section: TTemplateSection;
  title?: React.ReactNode;
  children?: (step: TTemplateStep, step_idx: number) => React.ReactNode;
  extraChildren?: React.ReactNode | React.ReactNode[];
}

interface ProcessSectionEditableProps extends ProcessSectionProps {
  mutator: (func: (section: TTemplateSection) => undefined) => void;
  onSectionAdd: () => void;
  onDelete: () => void;
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
        draft.title = title;
      });
    },
    [mutator]
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
              draft.steps.push(TemplateStep.parse({}));
            })
          }
        />
      }
      {...props}
    >
      {(step, step_idx) => (
        <ProcessStep.Editable
          step={step}
          mutator={(update) =>
            mutator((draft) => {
              update(draft.steps[step_idx]);
            })
          }
          onDelete={() =>
            mutator((draft) => {
              draft.steps.splice(step_idx, 1);
            })
          }
        />
      )}
    </ProcessSection>
  );
}

function ProcessSection({
  section,
  title,
  children,
  extraChildren,
}: ProcessSectionProps) {
  return (
    <Timeline.Item title={title ?? <Title order={2}>{section.title}</Title>}>
      <Stack gap="sm" mt="md">
        {section.steps.map((step, step_idx) =>
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

export { ProcessSection };
