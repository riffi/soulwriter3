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
  const [parentInstance, setParentInstance] = useState<string>('');
  const [step, setStep] = useState(1);

  const isChildBlock = !!relatedBlock.parentBlockUuid;
  const isTarget = blockRelation.targetBlockUuid === relatedBlock?.uuid;

  // Получаем все инстансы родительского блока
  const parentInstances = useLiveQuery(async () => {
    if (!relatedBlock.parentBlockUuid) return [];
    return BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock.parentBlockUuid);
  }, [relatedBlock]);

  // Получаем дочерние инстансы для выбранного родительского инстанса
  const childInstances = useLiveQuery(async () => {
    if (!parentInstance) return [];
    return BlockInstanceRepository.getChildInstances(bookDb, parentInstance);
  }, [parentInstance]);

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
    setParentInstance('');
    setTargetInstance('');
    setStep(1);
  };

  const renderModalContent = () => {
    if (isChildBlock) {
      return (
          <Stack>
            {step === 1 && (
                <Select
                    label="Выберите родительский инстанс"
                    value={parentInstance}
                    data={parentInstances?.map(inst => ({
                      value: inst.uuid,
                      label: inst.title
                    })) || []}
                    onChange={(value) => {
                      setParentInstance(value || '');
                      setStep(2);
                    }}
                />
            )}

            {step === 2 && (
                <>
                  <Select
                      label={`Выберите дочерний инстанс ${relatedBlock.title}`}
                      value={targetInstance}
                      data={childInstances?.map(inst => ({
                        value: inst.uuid,
                        label: inst.title
                      })) || []}
                      onChange={(value) => setTargetInstance(value || '')}
                  />

                  <Group justify="space-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Назад
                    </Button>
                    <Button onClick={handleCreateRelation} disabled={!targetInstance}>
                      Создать
                    </Button>
                  </Group>
                </>
            )}
          </Stack>
      );
    }

    return (
        <Select
            label={`Выберите ${relatedBlock?.titleForms?.accusative}`}
            value={targetInstance}
            data={availableInstances?.map(inst => ({
              value: inst.uuid,
              label: inst.title
            })) || []}
            onChange={(value) => setTargetInstance(value || '')}
        />
    );
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
              disabled={!isChildBlock && availableInstances.length === 0}
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

        <Modal
            opened={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setStep(1);
              setParentInstance('');
              setTargetInstance('');
            }}
            title={`Добавить ${relatedBlock?.titleForms?.accusative}`}
        >
          <Stack>
            {renderModalContent()}
            {!isChildBlock && (
                <Button onClick={handleCreateRelation} disabled={!targetInstance}>
                  Добавить
                </Button>
            )}
          </Stack>
        </Modal>
      </div>
  );
};
