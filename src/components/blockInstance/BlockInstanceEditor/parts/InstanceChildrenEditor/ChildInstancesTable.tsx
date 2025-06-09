import {Table, ActionIcon, Button, Group, TextInput, Timeline} from "@mantine/core";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import { BlockInstanceRepository } from "@/repository/BlockInstance/BlockInstanceRepository";
import { useState } from "react";
import { CreateChildInstanceModal } from "./modal/CreateChildInstanceModal";
import {IBlockInstance} from "@/entities/BookEntities";
import {IBlock, IBlockDisplayKind} from "@/entities/ConstructorEntities";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";

interface ChildInstancesTableProps {
  blockInstanceUuid: string;
  instances: IBlockInstance[];
  relatedBlock: IBlock
}

export const ChildInstancesTable = ({ blockInstanceUuid, instances, relatedBlock }: ChildInstancesTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {showDialog} = useDialog()

  const handleUpdateTitle = async (instance: IBlockInstance) => {
    await BlockInstanceRepository.update(bookDb, instance.uuid, {
      ...instance,
      title: editTitle,
    });
    setEditingId(null);
  };

  const handleDeleteInstance = async (instance: IBlockInstance) => {
    const result = showDialog("Внимание", `Вы действительно хотите удалить ${instance.title}?`);
    if (!result) return
    await BlockInstanceRepository.remove(bookDb, instance.uuid);
  };

  const renderContent = () => {
    if (relatedBlock.displayKind === IBlockDisplayKind.timeLine) {
      return (
          <Timeline active={instances.length} bulletSize={24} lineWidth={2}>
            {instances.map((instance) => (
                <Timeline.Item
                    key={instance.uuid}
                    title={instance.title}
                    bullet={
                      <ActionIcon
                          size={22}
                          variant="filled"
                          color="blue"
                          radius="xl"
                      >
                        {instances.indexOf(instance) + 1}
                      </ActionIcon>
                    }
                >
                  <Group gap="xs" mt="xs">
                    {editingId === instance.uuid ? (
                        <>
                          <TextInput
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.currentTarget.value)}
                              size="xs"
                          />
                          <Button size="xs" onClick={() => handleUpdateTitle(instance)}>
                            Сохранить
                          </Button>
                          <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                          >
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
                              onClick={() => handleDeleteInstance(instance)}
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                        </>
                    )}
                  </Group>
                </Timeline.Item>
            ))}
          </Timeline>
      );
    }

    return (
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
                                onClick={() => handleDeleteInstance(instance)}
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
    );
  };

  return (
      <div>
        <Group justify="flex-start" mb="md">
          <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => setIsModalOpen(true)}
              variant="light"
          >
            {relatedBlock.titleForms?.accusative}
          </Button>
        </Group>

        {renderContent()}

        <CreateChildInstanceModal
            opened={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            relatedBlock={relatedBlock}
            blockUuid={relatedBlock.uuid}
            blockInstanceUuid={blockInstanceUuid}
        />
      </div>
  );
};
