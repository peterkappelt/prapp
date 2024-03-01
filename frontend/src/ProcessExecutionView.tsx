import { Box, LoadingOverlay, Stack } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "./Api";
import { ProcessView } from "./components/Process/ProcessView";
import { ProcessExecution, TProcessExecution } from "./types";

export function ProcessExecutionView({ executionId }: { executionId: string }) {
  const api = useApi();
  const [execution, setExecution] = useState<TProcessExecution>();

  const updateExecution = useCallback(
    (exec: TProcessExecution) => {
      /**
       * TODO I feel like this should maybe be done in backend
       */

      //mark all the steps that are done
      exec.steps.forEach((s) => {
        if (s.type != "ST") return;
        if (s.startedAt && s.doneAt) s.state = "done";
      });

      // find the first step that is not done and mark it as active
      const activeStep = exec.steps.find(
        (s) => s.type == "ST" && s.state != "done"
      );
      if (activeStep) activeStep.state = "active";

      let isDone = true,
        hasActive = false;
      for (let i = exec.steps.length - 1; i >= 0; i--) {
        const step = exec.steps[i];
        if (step.type == "SE") {
          if (isDone) step.state = "done";
          if (hasActive) step.state = "active";
          isDone = true;
          hasActive = false;
        } else {
          if (step.state != "done") isDone = false;
          if (step.state == "active") hasActive = true;
        }
      }

      setExecution(exec);
    },
    [setExecution]
  );

  useEffect(() => {
    let active = true;

    const do_work = async () => {
      const res = await api.executions.executionsRetrieve({
        id: executionId,
      });
      if (!active) return;
      updateExecution(ProcessExecution.parse(res.process));
    };
    do_work();

    return () => {
      active = false;
    };
  }, [executionId, setExecution]);

  const onStepDone = useCallback(
    async (step: string) => {
      const stepIdx = execution?.steps.findIndex((s) => s.id == step);
      if (!stepIdx) return;
      const res = await api.executions.executionsMarkStep({
        executionMarkStepRequest: {
          markAs: "StepDone",
          stepIdx,
        },
        id: executionId,
      });
      updateExecution(ProcessExecution.parse(res.process));
    },
    [executionId, execution?.steps, api.executions, updateExecution]
  );

  const onStepStart = useCallback(
    async (step: string) => {
      const stepIdx = execution?.steps.findIndex((s) => s.id == step);
      if (!stepIdx) return;
      const res = await api.executions.executionsMarkStep({
        executionMarkStepRequest: {
          markAs: "StepStarted",
          stepIdx,
        },
        id: executionId,
      });
      updateExecution(ProcessExecution.parse(res.process));
    },
    [executionId, execution?.steps, api.executions, updateExecution]
  );

  return (
    <Box pos="relative">
      <LoadingOverlay visible={!execution} />
      <Stack>
        {execution && (
          <ProcessView.Execution
            process={execution}
            onStepDone={onStepDone}
            onStepStart={onStepStart}
          />
        )}
      </Stack>
    </Box>
  );
}
