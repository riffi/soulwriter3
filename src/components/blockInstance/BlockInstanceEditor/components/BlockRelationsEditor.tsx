import { useState } from 'react';
import {Table, Button, Group, Select, Modal, Stack, TextInput, ActionIcon} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import {IBlock, IBlockRelation} from '@/entities/ConstructorEntities';
import {generateUUID} from "@/utils/UUIDUtils";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";
import {IconLink, IconTrash} from "@tabler/icons-react";
import { Link } from 'react-router-dom';
import {IBlockInstanceRelation} from "@/entities/BookEntities"; // Импортируем компонент для навигации

interface BlockRelationsEditorProps {
  blockUuid: string;
  blockInstanceUuid: string;
  relatedBlock: IBlock;
  blockRelation: IBlockRelation
}

export const BlockRelationsEditor = ({ blockInstanceUuid, relatedBlock, blockRelation, blockUuid }: BlockRelationsEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetInstance, setTargetInstance] = useState<string>('');

  const instanceRelations = useLiveQuery(async () => {
    return BlockInstanceRepository.getRelatedInstances(bookDb, blockInstanceUuid, relatedBlock.uuid);
  }, [blockInstanceUuid]);

  const relatedBlockInstances = useLiveQuery(async () => {
    if (!relatedBlock) return [];
    return BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock?.uuid);
  }, [relatedBlock]);

  // Фильтрация: оставляем только инстансы, не участвующие в существующих связях
  const availableInstances = relatedBlockInstances?.filter(instance => {
    const isUsed = instanceRelations?.some(relation =>
        relation.sourceInstanceUuid === instance.uuid ||
        relation.targetInstanceUuid === instance.uuid
    );
    return !isUsed;
  }) || [];

  const handleCreateRelation = async () => {
    const isTarget = blockRelation.targetBlockUuid === relatedBlock?.uuid;
    const [sourceInstance, targetInstanceUuid] = isTarget
        ? [blockInstanceUuid, targetInstance]
        : [targetInstance, blockInstanceUuid];
    const [sourceBlock, targetBlock] = isTarget
        ? [blockUuid, relatedBlock.uuid]
        : [relatedBlock.uuid, blockUuid];

    await bookDb.blockInstanceRelations.add({
      sourceInstanceUuid: sourceInstance,
      targetInstanceUuid: targetInstanceUuid,
      sourceBlockUuid: sourceBlock,
      targetBlockUuid: targetBlock,
      blockRelationUuid: generateUUID()
    });

    setIsModalOpen(false);
    setTargetInstance('');
  };

  const getRelatedInstanceUuidFromRelation = (relation: IBlockInstanceRelation) => {
    // Если текущий экземпляр - источник, возвращает целевой экземпляр
    // иначе возвращает исходный экземпляр
    if (relation.sourceInstanceUuid === blockInstanceUuid) {
      return relation.targetInstanceUuid;
    }
    return relation.sourceInstanceUuid;
  }

  // Функция удаления связи
  const handleDeleteRelation = async (relationUuid: string) => {
    await bookDb.blockInstanceRelations.where('blockRelationUuid').equals(relationUuid).delete();
  };

  return (
      <div>
        <Group justify="space-between" mb="md">
          <Button
              onClick={() => setIsModalOpen(true)}
              variant="light"
              disabled={availableInstances.length === 0}
          >
            Добавить связь
          </Button>
        </Group>

        <Table>
          <Table.Thead>
          <Table.Tr>
            <Table.Th>{relatedBlock?.title}</Table.Th>
            <Table.Th>Действия</Table.Th>
          </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
          {instanceRelations?.map(relation => (
              <Table.Tr key={relation.uuid}>
                <Table.Td>
                  {relatedBlockInstances?.find(
                      instance =>
                          (instance.uuid === relation?.targetInstanceUuid)
                      ||  (instance.uuid === relation?.sourceInstanceUuid)
                  )?.title}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                        component={Link}
                        to={`/block-instance/card?uuid=${getRelatedInstanceUuidFromRelation(relation)}`}
                        variant="subtle"
                    >
                      <IconLink size={16} />
                    </ActionIcon>

                    <ActionIcon
                        color="red"
                        onClick={() => handleDeleteRelation(relation.blockRelationUuid)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
          ))}
          </Table.Tbody>
        </Table>

        <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Добавить связь">
          <Stack>
            <Select
                label="Выберите экземпляр"
                value={targetInstance}
                data={availableInstances.map(blockInstance => ({
                  value: blockInstance.uuid,
                  label: `${blockInstance.title}`
                }))}
                onChange={v => setTargetInstance(v || '')}
            />
            <Button onClick={handleCreateRelation}>Создать</Button>
          </Stack>
        </Modal>
      </div>
  );
};
