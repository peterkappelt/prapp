import { ActionIcon, Tooltip } from "@mantine/core";
import { IconEdit, IconPlayerPlay } from "@tabler/icons-react";

const StartExecutionButton = ({
  tooltip,
  disabled = false,
  onClick,
}: {
  tooltip?: string;
  disabled?: boolean;
  onClick: () => void;
}) => {
  return (
    <Tooltip label={tooltip ?? "Start a tracked execution of this process"}>
      <ActionIcon size="lg" disabled={disabled} onClick={onClick}>
        <IconPlayerPlay style={{ width: "70%", height: "70%" }} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );
};

const EditTemplateButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <ActionIcon size="lg" onClick={onClick}>
      <IconEdit style={{ width: "70%", height: "70%" }} stroke={1.5} />
    </ActionIcon>
  );
};

export { EditTemplateButton, StartExecutionButton };

