import {ActionIcon, Group} from "@mantine/core";
import {IconCheck, IconEdit, IconTrash} from "@tabler/icons-react";

interface ParameterActionsProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export const ParameterActions = ({
                            isEditing,
                            onEdit,
                            onSave,
                            onDelete
                          }: ParameterActionsProps) => (
    <Group gap={4}>
      {isEditing ? (
          <ActionIcon variant="subtle" onClick={onSave}>
            <IconCheck size={24} />
          </ActionIcon>
      ) : (
          <ActionIcon variant="subtle" onClick={onEdit}>
            <IconEdit size={24} />
          </ActionIcon>
      )}
      <ActionIcon variant="subtle" color="red" onClick={onDelete}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
);
