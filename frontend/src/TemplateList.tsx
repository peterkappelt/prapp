import {
  ActionIcon,
  Blockquote,
  Box,
  Button,
  Card,
  Grid,
  Group,
  LoadingOverlay,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconInfoCircle,
  IconPlus,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useLocation } from "wouter";
import { useApi } from "./Api";
import { Process } from "./api";
import {
  EditTemplateButton,
  StartExecutionButton,
} from "./components/Process/ActionButtons";
import { queries } from "./firebase/db";
import { TProcessExecutionDTO } from "./types";

export const ProcessExecutions = ({ id }: { id: string }) => {
  const [, setLocation] = useLocation();
  const [executions, setExecutions] =
    useState<[string, TProcessExecutionDTO][]>();

  useEffect(() => {
    let active = true;

    const do_work = async () => {
      const docs = await queries.getExecutionsForProcess(id);
      if (!active) return;
      setExecutions(docs);
    };
    do_work();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <Card withBorder shadow="none">
      <LoadingOverlay visible={!executions} />
      {!executions && <Skeleton>Loading...</Skeleton>}
      {executions && !executions.length && (
        <Blockquote color="blue" icon={<IconInfoCircle />}>
          There were no executions of this process so far.
        </Blockquote>
      )}
      {executions && executions.length
        ? executions.map(([e_id, e]) => (
            <Card.Section inheritPadding withBorder py="sm" key={e_id}>
              <Group justify="space-between">
                Initiated:&nbsp;{e.initiatedAt.toDate().toLocaleString()}
                <ActionIcon
                  variant="light"
                  onClick={() => setLocation(`/execution/${e_id}`)}
                >
                  <IconEye
                    style={{ width: "70%", height: "70%" }}
                    stroke={1.5}
                  />
                </ActionIcon>
              </Group>
            </Card.Section>
          ))
        : undefined}
    </Card>
  );
};

export const TemplateProcessCard = ({ process }: { process: Process }) => {
  const api = useApi();
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const startExecution = useCallback(async () => {
    const res = await api.processes.processesStartExecution({
      revision: process.meta.id,
    });
    setLocation(`/execution/${res.id}`);
  }, [process.meta.id, api.processes, setLocation]);

  return (
    <Box pos="relative">
      <Card shadow="sm" withBorder>
        <Card.Section inheritPadding pt="sm">
          <Grid>
            <Grid.Col span="auto">
              <Title order={2}>{process.title || "loading"}</Title>
            </Grid.Col>
            <Grid.Col span="content">
              <StartExecutionButton onClick={startExecution} />
            </Grid.Col>
            <Grid.Col span="content">
              <EditTemplateButton
                onClick={() => setLocation(`/template/${process.meta.id}`)}
              />
            </Grid.Col>
          </Grid>
        </Card.Section>
        <Text size="sm" c="dimmed">
          Created: {process.meta.createdAt.toLocaleString()}
        </Text>
        {!isExpanded && (
          <Card.Section inheritPadding>
            <ActionIcon
              variant="transparent"
              color="gray"
              w="100%"
              onClick={() => setIsExpanded(true)}
            >
              <IconChevronDown
                style={{ width: "70%", height: "70%" }}
                stroke={1.5}
              />
            </ActionIcon>
          </Card.Section>
        )}
        {isExpanded && (
          <Card.Section inheritPadding pb="md">
            <ActionIcon
              variant="transparent"
              color="gray"
              w="100%"
              onClick={() => setIsExpanded(false)}
            >
              <IconChevronUp
                style={{ width: "70%", height: "70%" }}
                stroke={1.5}
              />
            </ActionIcon>
            <ProcessExecutions id={process.meta.id} />
          </Card.Section>
        )}
      </Card>
    </Box>
  );
};

export const TemplateList = () => {
  const api = useApi();
  const [, setLocation] = useLocation();
  const [processes, setProcesses] = useImmer<Process[]>([]);

  useEffect(() => {
    let active = true;
    const do_work = async () => {
      const res = await api.processes.processesList();
      if (!active) return;
      setProcesses(res);
    };
    do_work();

    return () => {
      active = false;
    };
  }, [setProcesses, api.processes]);

  return (
    <Stack>
      <Group justify="flex-end">
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => setLocation(`/template/${crypto.randomUUID()}`)}
        >
          New Process
        </Button>
      </Group>
      {processes.map((process) => (
        <TemplateProcessCard key={process.meta.id} process={process} />
      ))}
    </Stack>
  );
};
