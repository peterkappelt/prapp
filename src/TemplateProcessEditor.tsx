import { TemplateProcess } from "@/types";
import { ProcessView } from "@components/Process/ProcessView";
import { Box, Button, LoadingOverlay, Stack, Switch } from "@mantine/core";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { collections, db, queries, storeProcessRevision } from "./db";

function TemplateProcessEditor({ templateId }: { templateId: string }) {
  const [editable, setEditable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [process, setProcess] = useImmer(TemplateProcess.parse({}));

  useEffect(() => {
    let active = true;
    const do_query = async () => {
      const data = await queries.getLatestTemplateProcessVersion(templateId);
      if (!active) return;
      if (!data) {
        setLoading(false);
        return;
      }
      setProcess(data);
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
        <Button onClick={() => storeProcessRevision(templateId, process)}>
          Save
        </Button>
        <Button
          onClick={async () => {
            const res = await addDoc(collection(db, "Exec"), {
              reference: doc(
                collections.templateProcessRevisions(templateId),
                "ddQS70nOvrSS7OQxB6E6"
              ),
            });
            console.log((await getDoc(res)).data());
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
