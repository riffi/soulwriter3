import { Table, ActionIcon, Button, Group, TextInput } from "@mantine/core";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import { BlockInstanceRepository } from "@/repository/BlockInstanceRepository";
import { useState } from "react";
import { CreateChildInstanceModal } from "./modal/CreateChildInstanceModal";
import {IBlockInstance} from "@/entities/BookEntities";

interface ChildInstancesTableProps {
  blockUuid: string;
  instances: IBlockInstance[];
}

export const ChildInstancesTable = ({ blockUuid, instances }: ChildInstancesTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdateTitle = async (instance: IBlockInstance) => {
    await BlockInstanceRepository.update(bookDb, instance.uuid, {
      ...instance,
      title: editTitle,
    });
    setEditingId(null);
  };

  const handleDeleteInstance = async (instanceUuid: string) => {
    await BlockInstanceRepository.remove(bookDb, instanceUuid);
  };

  return (
      <div>
        <Group justify="flex-start" mb="md">
          <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => setIsModalOpen(true)}
              variant="light"
          >
            Создать инстанс
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {instances.map((instance) => (
                <Table.Tr key={instance.uuid}>
                  <Table.Td>
                    {editingId === instance.uuid ? (
                        <TextInput
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.currentTarget.value)}
                        />
                    ) : (
                        instance.title
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {editingId === instance.uuid ? (
                          <>
                            <Button size="xs" onClick={() => handleUpdateTitle(instance)}>
                              Сохранить
                            </Button>
                            <Button size="xs" variant="outline" onClick={() => setEditingId(null)}>
                              Отмена
                            </Button>
                          </>
                      ) : (
                          <>
                            <ActionIcon
                                variant="subtle"
                                onClick={() => {
                                  setEditingId(instance.uuid);
                                  setEditTitle(instance.title);
                                }}
                            >
                              <IconEdit size="1rem" />
                            </ActionIcon>
                            <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => handleDeleteInstance(instance.uuid)}
                            >
                              <IconTrash size="1rem" />
                            </ActionIcon>
                          </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <CreateChildInstanceModal
            opened={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            blockUuid={blockUuid}
        />
      </div>
  );
};
