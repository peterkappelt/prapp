import { TTemplateProcess, TemplateProcess } from "@/types";
import { ProcessView } from "@components/Process/ProcessView";
import {
  ActionIcon,
  Box,
  Group,
  LoadingOverlay,
  Stack,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDeviceFloppy, IconPlayerPlay } from "@tabler/icons-react";
import {
  DocumentData,
  DocumentReference,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useLocation } from "wouter";
import { useAuth } from "./firebase/auth";
import { actions, docs, queries } from "./firebase/db";

function TemplateProcessEditor({ templateId }: { templateId: string }) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [process, setProcess] = useImmer(TemplateProcess.parse({}));
  const [docRef, setDocRef] =
    useState<DocumentReference<TTemplateProcess, DocumentData>>();
  const { user } = useAuth();

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
        <Group justify="flex-end">
          <Tooltip
            label={
              docRef
                ? "Start a tracked execution of this process"
                : "You must save the process definition before starting an execution"
            }
          >
            <ActionIcon
              size="lg"
              disabled={!docRef}
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
              <IconPlayerPlay
                style={{ width: "70%", height: "70%" }}
                stroke={1.5}
              />
            </ActionIcon>
          </Tooltip>
          <ActionIcon
            size="lg"
            onClick={async () => {
              const meta = await getDoc(docs.templateMeta(templateId));
              if (!meta.exists())
                await setDoc(docs.templateMeta(templateId), {
                  createdAt: serverTimestamp(),
                  createdBy: user?.uid,
                });

              await actions.storeProcessRevision(templateId, process);
              notifications.show({
                message: "Process changes saved successfully",
                color: "green",
              });
            }}
          >
            <IconDeviceFloppy
              style={{ width: "70%", height: "70%" }}
              stroke={1.5}
            />
          </ActionIcon>
        </Group>
        <ProcessView.Editable process={process} mutator={setProcess} />
      </Stack>
    </Box>
  );
}

export default TemplateProcessEditor;
