import { TTemplateStep } from "@/types";
import {
  ActionIcon,
  Card,
  CardSectionProps,
  TextInput,
  Title,
} from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import { IconTrash } from "@tabler/icons-react";
import Placeholder from "@tiptap/extension-placeholder";
import { BubbleMenu, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback } from "react";

interface ProcessStepProps {
  step: TTemplateStep;
  title?: React.ReactNode;
  titleProps?: CardSectionProps;
  descriptionProps?: React.ComponentProps<typeof StepDescriptionEditor>;
}

interface ProcessStepEditableProps extends ProcessStepProps {
  mutator: (func: (step: TTemplateStep) => undefined) => void;
  onDelete: () => void;
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
  titleProps,
  title,
  descriptionProps,
}: ProcessStepProps) {
  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      // styles={{
      //   root: {
      //     borderWidth:
      //       "calc(.0625rem*2*var(--mantine-scale))",
      //       borderColor: "var(--mantine-color-green-filled)"
      //   },
      // }}
    >
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

export { ProcessStep };
