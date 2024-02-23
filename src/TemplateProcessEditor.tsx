import { TTemplateProcess, TemplateProcess } from "@/types";
import { ProcessView } from "@components/Process/ProcessView";
import { Box, Button, LoadingOverlay, Stack, Switch } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { DocumentData, DocumentReference } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useLocation } from "wouter";
import { actions, queries } from "./db";

function TemplateProcessEditor({ templateId }: { templateId: string }) {
  const [, setLocation] = useLocation();
  const [editable, setEditable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [process, setProcess] = useImmer(TemplateProcess.parse({}));
  const [docRef, setDocRef] =
    useState<DocumentReference<TTemplateProcess, DocumentData>>();

  useEffect(() => {
    let active = true;
    const do_query = async () => {
      const res = await queries.getLatestTemplateProcessVersion(templateId);
      if (!active) return;
      if (!res) {
        setLoading(false);
        return;
      }
      setProcess(res.data());
      setDocRef(res.ref);
      setLoading(false);
    };
    do_query();
    return () => {
      active = false;
    };
  }, [templateId, setProcess]);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <Stack>
        <Switch
          checked={editable}
          onChange={(e) => setEditable(e.currentTarget.checked)}
          label="Editable"
        />
        <Button
          onClick={() => actions.storeProcessRevision(templateId, process)}
        >
          Save
        </Button>
        <Button
          onClick={async () => {
            if (!docRef) {
              notifications.show({
                message: "Process needs to be saved first",
                color: "red",
              });
              return;
            }
            const res = await actions.startProcessExecution(docRef);
            setLocation(`/execution/${res.id}`);
          }}
        >
          exec
        </Button>
        {editable ? (
          <ProcessView.Editable process={process} mutator={setProcess} />
        ) : (
          <ProcessView process={process} />
        )}
      </Stack>
    </Box>
  );
}

export default TemplateProcessEditor;
