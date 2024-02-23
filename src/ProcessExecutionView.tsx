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
  THistoryItem,
  TProcessExecution,
  TProcessExecutionDTO,
  TProcessExecutionStepInfo,
  TTemplateProcess,
} from "./types";

const mergeProcessExecution = (
  template?: TTemplateProcess,
  executionMeta?: TProcessExecutionDTO,
  history?: THistoryItem[]
): TProcessExecution | undefined => {
  if (!template || !executionMeta || !history) return;

  const stepInfo = template.sections
    .map((s) => s.steps)
    .flat()
    .reduce<Record<string, TProcessExecutionStepInfo>>((o, { id }) => {
      o[id] = {
        doneAt: history.find((h) => h.type == "step_done" && h.step == id)?.at,
        startedAt: history.find((h) => h.type == "step_started" && h.step == id)
          ?.at,
      };
      return o;
    }, {});

  let activeStep = 0;

  // create an array [sec_idx][step_idx] = done?
  // => it is done when the execution has both startedAt and doneAt properties set
  const stepsDone = template.sections.map((sec) =>
    sec.steps.map(
      (step) => stepInfo[step.id].startedAt && stepInfo[step.id].doneAt
    )
  );

  // create an array [sec_idx] = first_unfinished_step_idx
  const firstUnfinishedStepPerSection = stepsDone.map((step) =>
    step.findIndex((s) => !s)
  );

  // determine the first sec_idx, where there is an unfinished step
  let activeSection = firstUnfinishedStepPerSection.findIndex((s) => s != -1);
  if (activeSection == -1) {
    activeSection = 0;
  } else {
    activeStep = firstUnfinishedStepPerSection[activeSection];
  }

  return {
    ...template,
    ...executionMeta,
    stepInfo,
    activeSectionIdx: activeSection,
    activeStepIdx: activeStep,
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
