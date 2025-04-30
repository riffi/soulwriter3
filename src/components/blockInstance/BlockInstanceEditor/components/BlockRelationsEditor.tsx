import { useState } from 'react';
import {Table, Button, Group, Select, Modal, Stack, TextInput, ActionIcon} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import {IBlock, IBlockRelation} from '@/entities/ConstructorEntities';
import {generateUUID} from "@/utils/UUIDUtils";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";
import {IconLink, IconTrash} from "@tabler/icons-react";
import { Link } from 'react-router-dom';
import {IBlockInstance, IBlockInstanceRelation} from "@/entities/BookEntities"; // Импортируем компонент для навигации

interface BlockRelationsEditorProps {
  blockUuid: string;
  blockInstanceUuid: string;
  relatedBlock: IBlock;
  blockRelation: IBlockRelation
}

export const BlockRelationsEditor = ({ blockInstanceUuid, relatedBlock, blockRelation, blockUuid }: BlockRelationsEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetInstance, setTargetInstance] = useState<string>('');

  const isTarget = blockRelation.targetBlockUuid === relatedBlock?.uuid;


  // Получаем связи для текущего инстанса и связанного блока
  const instanceRelations = useLiveQuery(async () => {
    return BlockInstanceRepository.getRelatedInstances(bookDb, blockInstanceUuid, relatedBlock.uuid);
  }, [blockInstanceUuid]);

  // Получаем все инстансы связанного блока
  const relatedBlockInstances = useLiveQuery(async () => {
    if (!relatedBlock) return [];
    return BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock?.uuid);
  }, [relatedBlock]);

  const instanceCorrespondsToRelation = (instance: IBlockInstance, relation: IBlockInstanceRelation): boolean => {
    return (isTarget ?
        relation.targetInstanceUuid === instance.uuid :
        relation.sourceInstanceUuid === instance.uuid);
  }

  // Фильтрация: оставляем только инстансы, не участвующие в существующих связях
  const availableInstances = relatedBlockInstances?.filter(instance => {
    const isUsed = instanceRelations?.some(relation =>
        instanceCorrespondsToRelation(instance, relation)
    );
    return !isUsed;
  }) || [];


  const handleCreateRelation = async () => {
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
    if (isTarget) {
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
            {`Добавить ${relatedBlock?.titleForms?.accusative}`}
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
                      instance => instanceCorrespondsToRelation(instance, relation)
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
                        variant="subtle"
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

        <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Добавить ${relatedBlock?.titleForms?.accusative}`}>
          <Stack>
            <Select
                label={`Выберите ${relatedBlock?.titleForms?.accusative}`}
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
