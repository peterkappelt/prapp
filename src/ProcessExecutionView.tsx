import { Box, LoadingOverlay, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  addDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo } from "react";
import { useImmer } from "use-immer";
import { ProcessView } from "./components/Process/ProcessView";
import { collections, docs } from "./db";
import {
  HistoryItem,
  ProcessExecutionDTO,
  TExecutionSection,
  TExecutionStep,
  THistoryItem,
  TProcessExecution,
  TProcessExecutionDTO,
  TTemplateProcess,
} from "./types";

/** 
 * Merge a template process with an 
 * execution metadata object and the history
 * to a TProcessExecution object, which is
 * a TTemplateProcess enriched with execution
 * information
 */
const mergeProcessExecution = (
  template?: TTemplateProcess,
  executionMeta?: TProcessExecutionDTO,
  history?: THistoryItem[]
): TProcessExecution | undefined => {
  if (!template || !executionMeta || !history) return;

  const sections = template.sections.map<TExecutionSection>((sec) => {
    const steps = sec.steps.map<TExecutionStep>((step) => {
      // find the startedAt and doneAt timestamps in the history
      // TODO this assumes that history is sorted by at-time
      const startedAt = history.find(
        (h) => h.type == "step_started" && h.step == step.id
      )?.at;
      const doneAt = history.find(
        (h) => h.type == "step_done" && h.step == step.id
      )?.at;
      return {
        ...step,
        doneAt,
        startedAt,
        // it is surely done if there is a timestamp for doneAt
        state: doneAt ? "done" : undefined,
      };
    });

    return {
      ...sec,
      steps,
      // the section is surely done if each of its steps is done
      state: steps.every((s) => s.state == "done") ? "done" : undefined,
    };
  });

  //find the first step/ section that is not done and mark as active
  const activeSec = sections.find((s) => s.state != "done");
  if (activeSec) {
    activeSec.state = "active";
    const activeStep = activeSec.steps.find((s) => s.state != "done");
    if (activeStep) activeStep.state = "active";
  }

  return {
    ...template,
    ...executionMeta,
    sections,
  };
};

export function ProcessExecutionView({ executionId }: { executionId: string }) {
  const [[executionMeta, history], setExecution] = useImmer<
    [TProcessExecutionDTO, THistoryItem[]] | []
  >([]);
  const [template, setTemplate] = useImmer<TTemplateProcess | undefined>(
    undefined
  );

  useEffect(() => {
    let active = true;
    const unsubscribeMeta = onSnapshot(docs.execution(executionId), (doc) => {
      if (!active) return;
      setExecution((draft) => {
        draft[0] = ProcessExecutionDTO.parse(doc.data());
      });
    });
    const unsubscribeHistory = onSnapshot(
      collections.executionHistory(executionId),
      (res) => {
        if (!active) return;
        setExecution((draft) => {
          draft[1] = res.docs.map((d) => HistoryItem.parse(d.data()));
        });
      }
    );
    return () => {
      active = false;
      unsubscribeMeta();
      unsubscribeHistory();
    };
  }, [executionId, setExecution]);

  useEffect(() => {
    if (!executionMeta?.processRef) return;
    let active = true;

    const do_work = async () => {
      const res = await getDoc(executionMeta.processRef);

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
  }, [executionMeta?.processRef.path, setTemplate]);

  const info = useMemo(
    () => mergeProcessExecution(template, executionMeta, history),
    [template, executionMeta, history]
  );

  const onStepDone = useCallback(
    (step: string) => {
      addDoc(collections.executionHistory(executionId), {
        type: "step_done",
        step,
        at: serverTimestamp(),
      });
    },
    [executionId]
  );

  const onStepStart = useCallback(
    (step: string) => {
      addDoc(collections.executionHistory(executionId), {
        type: "step_started",
        step,
        at: serverTimestamp(),
      });
    },
    [executionId]
  );

  return (
    <Box pos="relative">
      <LoadingOverlay visible={!executionMeta || !template || !history} />
      <Stack>
        {info && (
          <ProcessView.Execution
            process={info}
            onStepDone={onStepDone}
            onStepStart={onStepStart}
          />
        )}
      </Stack>
    </Box>
  );
}
