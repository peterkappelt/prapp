import { TTemplateProcess, TTemplateSection, TemplateSection } from "@/types";
import { TextInput, Timeline, Title } from "@mantine/core";
import React, { useCallback } from "react";
import { ProcessSection } from "./ProcessSection";

interface ProcessViewProps {
  process: TTemplateProcess;
  title?: React.ReactNode;
  children?: (section: TTemplateSection, section_idx: number) => React.ReactNode;
}

interface ProcessViewEditableProps extends ProcessViewProps {
  mutator: (func: (section: TTemplateProcess) => undefined) => void;
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
          key={sec.id}
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

function ProcessView({ process, title, children }: ProcessViewProps) {
  return (
    <>
      {title ?? <Title order={1}>{process.title}</Title>}
      <Timeline lineWidth={3} bulletSize={40} active={0}>
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

export { ProcessView };
