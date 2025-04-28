import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookDb } from "@/entities/bookDb";
import { IBlockInstance } from "@/entities/BookEntities";
import {
  Button,
  Table,
  Text,
  Group,
  Box,
  ActionIcon,
  Badge,
  Modal,
  TextInput, Container,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { generateUUID } from "@/utils/UUIDUtils";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import classes from "./BlockInstanceManager.module.css";
import {
  useBlockInstanceManager
} from "@/components/blockInstance/BlockInstanceManager/useBlockInstanceManager";

export interface IBlockInstanceManagerProps {
  blockUuid: string;
}

export const BlockInstanceManager = (props: IBlockInstanceManagerProps) => {
  const {
    instances,
    block,
    addBlockInstance,
    instancesWithParams,
    blockParameters,
    deleteBlockInstance
  } = useBlockInstanceManager(props.blockUuid);

  const [addingInstance, setAddingInstance] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const navigate = useNavigate();
  const { showDialog } = useDialog();


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
      await addBlockInstance(newInstance);
      close();
      navigate(`/block-instance/card?uuid=${uuid}`);
    } finally {
      setAddingInstance(false);
    }
  };

  const handleEditInstance = (uuid: string) => {
    navigate(`/block-instance/card?uuid=${uuid}`);
  };

  const handleDeleteInstance = async (data: IBlockInstance) => {
    const result = await showDialog("Вы уверены?", `Удалить ${data.title}?`);
    if (result && bookDb) {
      await deleteBlockInstance(data);
    }
  };

  return (
      <Container>
      <Box className={classes.container} pos="relative">

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
          {instances?.length > 0 ? (
              <Table.Tbody>
                {instancesWithParams?.map((instance) => (
                    <Table.Tr key={instance.uuid}>
                      <Table.Td>
                        <div>
                          <Text fw={500}>{instance.title}</Text>
                          <Group gap="xs" mt={4}>
                            {blockParameters?.map((param) => {
                              const paramInstance = instance.params?.find(
                                  (p) => p.blockParameterUuid === param.uuid
                              );
                              return (
                                  <Badge
                                      key={param.uuid}
                                      variant="light"
                                      color="blue"
                                      radius="sm"
                                  >
                                    {param.title}: {paramInstance?.value || '—'}
                                  </Badge>
                              );
                            })}
                          </Group>
                        </div>
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
                              onClick={() => handleDeleteInstance(instance)}
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
      </Container>
  );
};
