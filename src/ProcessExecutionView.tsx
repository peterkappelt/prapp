import { Box, LoadingOverlay, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { ProcessView } from "./components/Process/ProcessView";
import { docs } from "./db";
import { ProcessExecution, TProcessExecution, TemplateProcess } from "./types";

export function ProcessExecutionView({ executionId }: { executionId: string }) {
  const [execution, setExecution] = useState<TProcessExecution>();
  const [template, setTemplate] = useImmer(TemplateProcess.parse({}));

  useEffect(() => {
    let active = true;
    const unsubscribe = onSnapshot(docs.execution(executionId), (doc) => {
      if (!active) return;
      setExecution(ProcessExecution.parse(doc.data()));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [executionId]);

  useEffect(() => {
    if (!execution?.processRef) return;
    let active = true;

    const do_work = async () => {
      const res = await getDoc(execution.processRef);
      console.log("Upd templ");
      if (!active) return;
      const data = res.data();
      if (!data) {
        notifications.show({
          message: "Failed to fetch process information!",
          color: "red",
        });
        return;
      }
      setTemplate(data);
    };
    do_work();

    return () => {
      active = false;
    };
  }, [execution?.processRef.path, setTemplate]);

  const onStepDone = useCallback(
    (step_id: string) => {
      setDoc(
        docs.execution(executionId),
        {
          steps: {
            [step_id]: {
              doneAt: serverTimestamp(),
            },
          },
        },
        { merge: true }
      );
    },
    [executionId]
  );

  const onStepStart = useCallback(
    (step_id: string) => {
      setDoc(
        docs.execution(executionId),
        {
          steps: {
            [step_id]: {
              startedAt: serverTimestamp(),
            },
          },
        },
        { merge: true }
      );
    },
    [executionId]
  );

  return (
    <Box pos="relative">
      <LoadingOverlay visible={!execution || !template} />
      <Stack>
        {execution && (
          <ProcessView.Execution
            process={template}
            onStepDone={onStepDone}
            onStepStart={onStepStart}
            execution={execution}
          />
        )}
      </Stack>
    </Box>
  );
}
