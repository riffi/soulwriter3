import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookDb } from "@/entities/bookDb";
import { IBlockInstance } from "@/entities/BookEntities";
import { IBlock } from "@/entities/ConstructorEntities";
import { configDatabase } from "@/entities/configuratorDb";
import {
  Button,
  Table,
  Text,
  Group,
  Box,
  ActionIcon,
  LoadingOverlay,
  Modal,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { generateUUID } from "@/utils/UUIDUtils";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import classes from "./BlockInstanceManager.module.css";

export interface IBlockInstanceManagerProps {
  blockUuid: string;
}

export const BlockInstanceManager = (props: IBlockInstanceManagerProps) => {
  const [instances, setInstances] = useState<IBlockInstance[]>([]);
  const [block, setBlock] = useState<IBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingInstance, setAddingInstance] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const navigate = useNavigate();
  const { showDialog } = useDialog();

  useEffect(() => {
    loadData();
  }, [props.blockUuid]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadInstances(), loadBlock()]);
    } finally {
      setLoading(false);
    }
  };

  const loadInstances = async () => {
    if (!bookDb) return;
    const instances = await bookDb.blockInstances
    .where('blockUuid')
    .equals(props.blockUuid)
    .toArray();
    setInstances(instances);
  };

  const loadBlock = async () => {
    const block = await configDatabase.blocks
    .where('uuid')
    .equals(props.blockUuid)
    .first();
    setBlock(block);
    setNewInstanceName(`${block?.title}`);
  };

  const handleAddClick = () => {
    setNewInstanceName(`${block?.title}`);
    open();
  };

  const handleCreateInstance = async () => {
    if (!bookDb || !newInstanceName.trim()) return;

    setAddingInstance(true);
    try {
      const uuid = generateUUID();
      const newInstance: IBlockInstance = {
        blockUuid: props.blockUuid,
        uuid,
        title: newInstanceName.trim(),
      };
      await bookDb.blockInstances.add(newInstance);
      close();
      navigate(`/block-instance/card?uuid=${uuid}`);
    } finally {
      setAddingInstance(false);
    }
  };

  const handleEditInstance = (uuid: string) => {
    navigate(`/block-instance/card?uuid=${uuid}`);
  };

  const handleDeleteInstance = async (uuid: string) => {
    const result = await showDialog("Вы уверены?", "Удалить блок?");
    if (result && bookDb) {
      await bookDb.blockInstances.where('uuid').equals(uuid).delete();
      loadData();
    }
  };

  return (
      <Box className={classes.container} pos="relative">
        <LoadingOverlay visible={loading} overlayBlur={2} />

        <Button
            onClick={handleAddClick}
            leftSection={<IconPlus size="1rem" />}
            size="sm"
            variant="light"
            mb="md"
            className={classes.addButton}
        >
          Добавить
        </Button>

        <Table striped highlightOnHover className={classes.table}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th width={150}>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          {instances.length > 0 ? (
              <Table.Tbody>
                {instances.map((instance) => (
                    <Table.Tr key={instance.uuid}>
                      <Table.Td>
                        <Text fw={500}>{instance.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="center">
                          <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEditInstance(instance.uuid!)}
                          >
                            <IconEdit size="1rem" />
                          </ActionIcon>
                          <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDeleteInstance(instance.uuid!)}
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                ))}
              </Table.Tbody>
          ) : (
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td colSpan={2}>
                    <Text c="dimmed" ta="center" py="md" size="sm">
                      Добавьте {block?.titleForms?.accusative}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
          )}
        </Table>

        <Modal
            opened={opened}
            onClose={close}
            title={"Создание " + block?.titleForms?.genitive}
            centered
        >
          <TextInput
              label="Название"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.currentTarget.value)}
              placeholder="Введите название"
              mb="md"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
                onClick={handleCreateInstance}
                loading={addingInstance}
                disabled={!newInstanceName.trim()}
            >
              Создать
            </Button>
          </Group>
        </Modal>
      </Box>
  );
};
