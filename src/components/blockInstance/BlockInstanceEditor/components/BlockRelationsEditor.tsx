import { useState } from 'react';
import { Table, Button, Group, Select, Modal, Stack, ActionIcon } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import { IBlock, IBlockRelation } from '@/entities/ConstructorEntities';
import { generateUUID } from "@/utils/UUIDUtils";
import { BlockInstanceRepository } from "@/repository/BlockInstanceRepository";
import { IconLink, IconTrash } from "@tabler/icons-react";
import { Link } from 'react-router-dom';
import { IBlockInstance, IBlockInstanceRelation } from "@/entities/BookEntities";

interface BlockRelationsEditorProps {
  blockUuid: string;
  blockInstanceUuid: string;
  relatedBlock: IBlock;
  blockRelation: IBlockRelation;
}

const mapInstancesToOptions = (instances?: IBlockInstance[]) =>
    instances?.map(({ uuid, title }) => ({ value: uuid, label: title })) || [];

export const BlockRelationsEditor = ({
                                       blockInstanceUuid,
                                       relatedBlock,
                                       blockRelation,
                                       blockUuid
                                     }: BlockRelationsEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetInstanceUuid, setTargetInstanceUuid] = useState('');
  const [parentInstanceUuid, setParentInstanceUuid] = useState('');
  const [step, setStep] = useState(1);

  const isChildBlock = !!relatedBlock.parentBlockUuid;
  const isTarget = blockRelation.targetBlockUuid === relatedBlock?.uuid;

  // Запросы данных
  const parentInstances = useLiveQuery(() =>
          isChildBlock
              ? BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock.parentBlockUuid!)
              : Promise.resolve([])
      , [relatedBlock]);

  const childInstances = useLiveQuery(() =>
          parentInstanceUuid
              ? BlockInstanceRepository.getChildInstances(bookDb, parentInstanceUuid)
              : Promise.resolve([])
      , [parentInstanceUuid]);

  const instanceRelations = useLiveQuery(() =>
          BlockInstanceRepository.getRelatedInstances(bookDb, blockInstanceUuid, relatedBlock.uuid)
      , [blockInstanceUuid]);

  const allRelatedInstances = useLiveQuery(() =>
          BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock.uuid)
      , [relatedBlock]);

  // Логика фильтрации
  const isInstanceInRelation = (instance: IBlockInstance, relation: IBlockInstanceRelation) =>
      isTarget
          ? relation.targetInstanceUuid === instance.uuid
          : relation.sourceInstanceUuid === instance.uuid;

  const unusedInstances = allRelatedInstances?.filter(instance =>
      !instanceRelations?.some(relation => isInstanceInRelation(instance, relation))
  ) || [];

  // Обработчики действий
  const createRelation = async () => {
    const [source, target] = isTarget
        ? [blockInstanceUuid, targetInstanceUuid]
        : [targetInstanceUuid, blockInstanceUuid];

    const relation: IBlockInstanceRelation = {
      sourceInstanceUuid: source,
      targetInstanceUuid: target,
      sourceBlockUuid: isTarget ? blockUuid : relatedBlock.uuid,
      targetBlockUuid: isTarget ? relatedBlock.uuid : blockUuid,
      blockRelationUuid: generateUUID()
    };

    await bookDb.blockInstanceRelations.add(relation);
    resetModalState();
  };

  const deleteRelation = async (relationUuid: string) =>
      await bookDb.blockInstanceRelations.where('blockRelationUuid').equals(relationUuid).delete();

  const resetModalState = () => {
    setIsModalOpen(false);
    setParentInstanceUuid('');
    setTargetInstanceUuid('');
    setStep(1);
  };

  // Рендер компонентов
  const RelationRow = ({ relation }: { relation: IBlockInstanceRelation }) => {
    const relatedInstanceUuid = isTarget
        ? relation.targetInstanceUuid
        : relation.sourceInstanceUuid;

    const instance = allRelatedInstances?.find(i => i.uuid === relatedInstanceUuid);

    return (
        <Table.Tr>
          <Table.Td>{instance?.title}</Table.Td>
          <Table.Td>
            <Group gap="xs">
              <ActionIcon
                  component={Link}
                  to={`/block-instance/card?uuid=${relatedInstanceUuid}`}
                  variant="subtle"
              >
                <IconLink size={16} />
              </ActionIcon>
              <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => deleteRelation(relation.blockRelationUuid)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Table.Td>
        </Table.Tr>
    );
  };

  const ChildBlockModal = () => (
      <Stack>
        {step === 1 && (
            <Select
                label="Выберите родительский инстанс"
                value={parentInstanceUuid}
                data={mapInstancesToOptions(parentInstances)}
                onChange={v => {
                  setParentInstanceUuid(v || '');
                  setStep(2);
                }}
            />
        )}
        {step === 2 && (
            <>
              <Select
                  label={`Выберите дочерний инстанс ${relatedBlock.title}`}
                  value={targetInstanceUuid}
                  data={mapInstancesToOptions(childInstances)}
                  onChange={v => setTargetInstanceUuid(v || '')}
              />
              <Group justify="space-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Назад
                </Button>
                <Button onClick={createRelation} disabled={!targetInstanceUuid}>
                  Создать
                </Button>
              </Group>
            </>
        )}
      </Stack>
  );

  const DefaultModal = () => (
      <>
        <Select
            label={`Выберите ${relatedBlock?.titleForms?.accusative}`}
            value={targetInstanceUuid}
            data={mapInstancesToOptions(unusedInstances)}
            onChange={v => setTargetInstanceUuid(v || '')}
        />
        <Button onClick={createRelation} disabled={!targetInstanceUuid} mt="md">
          Добавить
        </Button>
      </>
  );

  return (
      <div>
        <Group justify="space-between" mb="md">
          <Button
              onClick={() => setIsModalOpen(true)}
              variant="light"
              disabled={!isChildBlock && unusedInstances.length === 0}
          >
            {`Добавить ${relatedBlock?.titleForms?.accusative}`}
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{relatedBlock.title}</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {instanceRelations?.map(relation =>
                <RelationRow key={relation.blockRelationUuid} relation={relation} />
            )}
          </Table.Tbody>
        </Table>

        <Modal
            opened={isModalOpen}
            onClose={resetModalState}
            title={`Добавить ${relatedBlock?.titleForms?.accusative}`}
        >
          {isChildBlock ? <ChildBlockModal /> : <DefaultModal />}
        </Modal>
      </div>
  );
};
