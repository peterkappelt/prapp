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
import {
  EditTemplateButton,
  StartExecutionButton,
} from "./components/Process/ActionButtons";
import {
  TDocumentReference_TemplateProcess,
  actions,
  queries,
} from "./firebase/db";
import { TProcessExecutionDTO, TTemplateMeta, TTemplateProcess } from "./types";

type TTemplateMetas = Record<string, TTemplateMeta>;

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

export const TemplateProcessCard = ({
  id,
  meta,
}: {
  id: string;
  meta: TTemplateMeta;
}) => {
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [process, setProcess] = useState<TTemplateProcess>();
  const [docRef, setDocRef] = useState<TDocumentReference_TemplateProcess>();

  useEffect(() => {
    let active = true;
    const do_query = async () => {
      const res = await queries.getLatestTemplateProcessVersion(id);
      if (!active || !res) return;
      setProcess(res.data());
      setDocRef(res.ref);
    };
    do_query();
    return () => {
      active = false;
    };
  }, [id, setProcess]);

  const startExecution = useCallback(async () => {
    if (!docRef) return;
    const res = await actions.startProcessExecution(docRef);
    setLocation(`/execution/${res.id}`);
  }, [docRef, setLocation]);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={!process || !docRef} />
      <Card shadow="sm" withBorder>
        <Card.Section inheritPadding pt="sm">
          <Grid>
            <Grid.Col span="auto">
              <Skeleton visible={!process}>
                <Title order={2}>{process?.title || "loading"}</Title>
              </Skeleton>
            </Grid.Col>
            <Grid.Col span="content">
              <StartExecutionButton onClick={startExecution} />
            </Grid.Col>
            <Grid.Col span="content">
              <EditTemplateButton
                onClick={() => setLocation(`/template/${id}`)}
              />
            </Grid.Col>
          </Grid>
        </Card.Section>
        <Text size="sm" c="dimmed">
          Created: {meta.createdAt.toDate().toLocaleString()}
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
            <ProcessExecutions id={id} />
          </Card.Section>
        )}
      </Card>
    </Box>
  );
};

export const TemplateList = () => {
  const [, setLocation] = useLocation();
  const [templates, setTemplates] = useImmer<TTemplateMetas>({});

  useEffect(() => {
    let active = true;
    const do_work = async () => {
      const res = await queries.getAvailableTemplates();
      if (!active) return;

      setTemplates(
        res.docs.reduce<TTemplateMetas>((o, doc) => {
          o[doc.id] = doc.data();
          return o;
        }, {})
      );
    };
    do_work();

    return () => {
      active = false;
    };
  }, [setTemplates]);

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
      {Object.entries(templates).map(([id, meta]) => (
        <TemplateProcessCard key={id} id={id} meta={meta} />
      ))}
    </Stack>
  );
};
