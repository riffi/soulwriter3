// Обновленный GroupsModal.tsx
import {Modal, Group, Button, ActionIcon, TextInput, Flex} from "@mantine/core";
import { IconPlus, IconArrowUp, IconArrowDown, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { IBlockParameterGroup } from "@/entities/ConstructorEntities";
import { useState } from "react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";

interface IGroupsModalProps {
  opened: boolean;
  onClose: () => void;
  paramGroupList: IBlockParameterGroup[];
  onSaveGroup: (newTitle: string) => void;
  onMoveGroupUp: (uuid: string) => void;
  onMoveGroupDown: (uuid: string) => void;
  onDeleteGroup: (uuid: string) => void;
  onUpdateGroupTitle: (uuid: string, newTitle: string) => void; // Добавлен новый проп
}

export const GroupsModal = ({
                              opened,
                              onClose,
                              paramGroupList,
                              onSaveGroup,
                              onMoveGroupUp,
                              onMoveGroupDown,
                              onDeleteGroup,
                              onUpdateGroupTitle, // Добавлен новый проп
                            }: IGroupsModalProps) => {
  const [newGroupTitle, setNewGroupTitle] = useState('');

  const handleSave = () => {
    if (!newGroupTitle.trim()) {
      notifications.show({
        title: "Ошибка",
        message: "Название вкладки не может быть пустым",
        color: "red",
      });
      return;
    }

    onSaveGroup(newGroupTitle);
    setNewGroupTitle('');
  };

  const handleDelete = (uuid: string) => {
    if (paramGroupList.length <= 1) {
      notifications.show({
        title: "Ошибка",
        message: "Нельзя удалить последнюю вкладку",
        color: "red",
      });
      return;
    }
    onDeleteGroup(uuid);
  };

  return (
      <Modal
          opened={opened}
          onClose={onClose}
          title="Управление вкладками"
          size="lg"
      >
        <Flex justify="flex-start" align="self-end" mb="md" gap="md">
          <TextInput
              label="Название новой вкладки"
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              placeholder="Введите название"
              required
          />
          <Button
              onClick={handleSave}
              leftSection={<IconPlus size="1rem" />}
          >
            Добавить вкладку
          </Button>
        </Flex>

        {paramGroupList?.map((group, index) => (
            <Group key={group.uuid} mb="xs" grow>
              <InlineEdit
                  value={group.title}
                  onChange={(newTitle) => onUpdateGroupTitle(group.uuid, newTitle)}
                  placeholder="Название вкладки"
                  inputProps={{
                    style: { flex: 1 }
                  }}
              />
              <Group gap={5}>
                <ActionIcon
                    variant="light"
                    onClick={() => onMoveGroupUp(group.uuid)}
                    disabled={index === 0}
                >
                  <IconArrowUp size="1rem" />
                </ActionIcon>
                <ActionIcon
                    variant="light"
                    onClick={() => onMoveGroupDown(group.uuid)}
                    disabled={index === paramGroupList.length - 1}
                >
                  <IconArrowDown size="1rem" />
                </ActionIcon>
                <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => handleDelete(group.uuid)}
                    disabled={paramGroupList.length <= 1}
                >
                  <IconTrash size="1rem" />
                </ActionIcon>
              </Group>
            </Group>
        ))}
      </Modal>
  );
};
