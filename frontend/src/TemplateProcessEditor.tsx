import { ProcessView } from "@components/Process/ProcessView";
import { ActionIcon, Box, Group, LoadingOverlay, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useLocation } from "wouter";
import { useApi } from "./Api";
import { StartExecutionButton } from "./components/Process/ActionButtons";
import { Process, Process_Empty, TProcess } from "./newtypes";

function TemplateProcessEditor({ templateId }: { templateId: string }) {
  const [, setLocation] = useLocation();
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [process, setProcess] = useImmer<TProcess>(Process_Empty);

  useEffect(() => {
    let active = true;

    if (templateId == "new") {
      setLoading(false);
      return;
    }

    const do_query = async () => {
      try {
        const res = await api.processes.processesRetrieve({
          revision: templateId,
        });
        if (!active) return;
        setProcess(Process.parse(res));
        setLoading(false);
      } catch (err) {
        notifications.show({
          title: "Failed loading process",
          message:
            "An error occured. This process might not exist or you don't have permission. " +
            String(err),
          color: "red",
        });
      }
    };
    do_query();
    return () => {
      active = false;
    };
  }, [templateId, setProcess, api]);

  console.log(process.meta);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <Stack>
        <Group justify="flex-end">
          <StartExecutionButton
            tooltip={
              !process.meta
                ? "You must save the process definition before starting an execution"
                : undefined
            }
            disabled={!process.meta}
            onClick={async () => {
              // if (!docRef) {
              //   notifications.show({
              //     message: "Process needs to be saved first",
              //     color: "red",
              //   });
              //   return;
              // }
              // const res = await actions.startProcessExecution(docRef);
              // setLocation(`/execution/${res.id}`);
            }}
          />
          <ActionIcon
            size="lg"
            onClick={async () => {
              if (process.meta) {
                await api.processes.processesUpdate({
                  revision: process.meta.id,
                  processRequest: process,
                });
              } else {
                const res = await api.processes.processesCreate({
                  processRequest: process,
                });
                setProcess(Process.parse(res));
                setLocation(`/template/${res.meta.id}`, { replace: true });
              }
              notifications.show({
                message: "Process saved successfully",
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
