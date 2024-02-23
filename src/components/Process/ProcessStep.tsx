import { TProcessExecutionStepInfo, TTemplateStep } from "@/types";
import {
  ActionIcon,
  Card,
  CardProps,
  CardSectionProps,
  Grid,
  Group,
  Stepper,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { RichTextEditor } from "@mantine/tiptap";
import {
  IconCircleCheck,
  IconPlayerPlay,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import Placeholder from "@tiptap/extension-placeholder";
import { BubbleMenu, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useMemo } from "react";

interface ProcessStepProps {
  step: TTemplateStep;
  title?: React.ReactNode;
  cardProps?: CardProps;
  titleProps?: CardSectionProps;
  descriptionProps?: React.ComponentProps<typeof StepDescriptionEditor>;
}

interface ProcessStepEditableProps extends ProcessStepProps {
  mutator: (func: (step: TTemplateStep) => undefined) => void;
  onDelete: () => void;
}

interface ProcessStepExecutionProps extends ProcessStepProps {
  executionInfo: TProcessExecutionStepInfo;
  isNext?: boolean;
  onStart: () => void;
  onDone: () => void;
}

function ProcessStepExecution({
  executionInfo,
  onStart,
  onDone,
  isNext = false,
  ...props
}: ProcessStepExecutionProps) {
  const isMobile = useMediaQuery(`(max-width: 62em)`);

  // state meanings:
  //  - isNext: this step is the next to be started or the current active one
  //  - isActive: step is started, but not done yet
  //  - isDone: step is done
  const [isActive, isDone] = useMemo(
    () => [
      !!executionInfo.startedAt && !executionInfo.doneAt,
      !!executionInfo.doneAt,
    ],
    [executionInfo]
  );

  // the "next" and "done" state gets a thicker border (2*)
  const borderWidth = useMemo(
    () =>
      isNext || isDone ? "calc(2*.0625rem*var(--mantine-scale))" : undefined,
    [isNext, isDone]
  );

  // colored border and shadow
  const [borderColor, shadow] = useMemo(() => {
    if (isDone) return ["var(--mantine-color-green-filled)", "sm-green"];
    if (isNext) return ["var(--mantine-color-blue-filled)", "sm-blue"];
    return [undefined, "sm"];
  }, [isNext, isDone]);

  const stepperStep = useMemo(() => {
    if (isDone) return 3;
    if (isActive) return 1;
    return 0;
  }, [isActive, isDone]);

  return (
    <ProcessStep
      cardProps={{
        styles: {
          root: {
            borderWidth,
            borderColor,
          },
        },
        shadow,
      }}
      title={
        <Grid mt="sm" mb="sm">
          <Grid.Col span={12}>
            <Group justify="space-between">
              <Title order={3}>{props.step.title}</Title>
              {isNext && !isActive && (
                <Tooltip label="Start this step">
                  <ActionIcon variant="filled" size="lg" onClick={onStart}>
                    <IconPlayerPlay
                      style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  </ActionIcon>
                </Tooltip>
              )}
              {isActive && (
                <Tooltip label="Mark this step as done">
                  <ActionIcon variant="filled" size="lg" onClick={onDone}>
                    <IconCircleCheck
                      style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Grid.Col>
          {(isNext || isActive || isDone) && (
            <Grid.Col span={12}>
              <Stepper
                size={isMobile ? "xs" : "sm"}
                active={stepperStep}
                orientation={isMobile ? "vertical" : "horizontal"}
              >
                <Stepper.Step
                  label="Started"
                  completedIcon={<IconPlayerPlay />}
                  description={
                    executionInfo.startedAt &&
                    executionInfo.startedAt.toDate().toLocaleString()
                  }
                />
                <Stepper.Step
                  icon={<IconSettings />}
                  completedIcon={<IconSettings />}
                />
                <Stepper.Step
                  label="Done"
                  description={
                    executionInfo.doneAt &&
                    executionInfo.doneAt.toDate().toLocaleString()
                  }
                  mih={0}
                />
              </Stepper>
            </Grid.Col>
          )}
        </Grid>
      }
      {...props}
    />
  );
}

function ProcessStepEditable({
  mutator,
  onDelete,
  ...props
}: ProcessStepEditableProps) {
  const handleTitleChange = useCallback(
    (title: string) => {
      mutator((step) => {
        step.title = title;
      });
    },
    [mutator]
  );

  const handleDescChange = useCallback(
    (description: string) => {
      mutator((step) => {
        step.description = description;
      });
    },
    [mutator]
  );

  return (
    <ProcessStep
      title={
        <TextInput
          size="lg"
          variant="unstyled"
          placeholder="Step Title"
          value={props.step.title}
          onChange={(e) => handleTitleChange(e.currentTarget.value)}
          rightSection={
            <ActionIcon variant="default" onClick={onDelete}>
              <IconTrash style={{ width: "70%", height: "70%" }} stroke={1.5} />
            </ActionIcon>
          }
        />
      }
      titleProps={{ pr: 0 }}
      descriptionProps={{
        onChange: handleDescChange,
        editable: true,
      }}
      {...props}
    />
  );
}

function ProcessStep({
  step,
  cardProps,
  titleProps,
  title,
  descriptionProps,
}: ProcessStepProps) {
  return (
    <Card withBorder shadow="sm" radius="md" {...cardProps}>
      <Card.Section withBorder inheritPadding {...titleProps}>
        {title ?? (
          <Title order={3} mt="sm" mb="sm">
            {step.title}
          </Title>
        )}
      </Card.Section>
      <Card.Section>
        <StepDescriptionEditor value={step.description} {...descriptionProps} />
      </Card.Section>
    </Card>
  );
}

function StepDescriptionEditor({
  value = "",
  editable = false,
  onChange,
}: {
  value?: string;
  editable?: boolean;
  onChange?: (v: string) => void;
}) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder: "Describe this step" }),
      ],
      content: value,
      onUpdate: ({ editor }) => onChange && onChange(editor.getHTML() || ""),
      editable,
    },
    [editable]
  );

  return (
    <RichTextEditor
      editor={editor}
      styles={{
        root: {
          border: "none",
        },
      }}
    >
      {editor && (
        <BubbleMenu editor={editor}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
          </RichTextEditor.ControlsGroup>
        </BubbleMenu>
      )}
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}

ProcessStep.Editable = ProcessStepEditable;
ProcessStep.Execution = ProcessStepExecution;

export { ProcessStep };
