import {ActionIcon, Group} from "@mantine/core";
import {IconCheck, IconEdit, IconTrash} from "@tabler/icons-react";

interface ParameterActionsProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  isDefault?: boolean;
}

export const ParameterActions = ({
                            isEditing,
                            onEdit,
                            onSave,
                            onDelete,
                            isDefault
                          }: ParameterActionsProps) => (
    <Group gap={4}>
      {isEditing ? (
          <ActionIcon variant="subtle" onClick={onSave}>
            <IconCheck size="1rem" />
          </ActionIcon>
      ) : (
          <ActionIcon variant="subtle" onClick={onEdit}>
            <IconEdit size="1rem" />
          </ActionIcon>
      )}
      {!isDefault && (
          <ActionIcon variant="subtle" color="red" onClick={onDelete}>
            <IconTrash size="1rem" />
          </ActionIcon>
      )}
    </Group>
);
