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
import {BlockRepository} from "@/repository/BlockRepository";

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

  const isChildBlock = !!relatedBlock.parentBlockUuid;
  const isRelatedBlockTarget = blockRelation.targetBlockUuid === relatedBlock?.uuid;

  // Логика фильтрации
  const isInstanceInRelation = (instance: IBlockInstance, relation: IBlockInstanceRelation) =>
      isRelatedBlockTarget
          ? relation.targetInstanceUuid === instance.uuid
          : relation.sourceInstanceUuid === instance.uuid;

  // Родительские инстансы связанного блока
  const relatedParentInstances = useLiveQuery(() =>
          isChildBlock
              ? BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock.parentBlockUuid!)
              : Promise.resolve([])
      , [relatedBlock]);

  // Родительский блок для связанного блока
  const relatedParentBlock = useLiveQuery<IBlock>(() =>
    isChildBlock
        ? BlockRepository.getByUuid(bookDb, relatedBlock.parentBlockUuid!)
        : Promise.resolve(null)
  , [relatedBlock]);

  const relatedChildInstances = useLiveQuery(() =>
          parentInstanceUuid
              ? BlockInstanceRepository.getChildInstances(bookDb, parentInstanceUuid)
              : Promise.resolve([])
      , [parentInstanceUuid]);

  // Все связи инстансов
  const instanceRelations = useLiveQuery(() =>
          BlockInstanceRepository.getRelatedInstances(bookDb, blockInstanceUuid, relatedBlock.uuid)
      , [blockInstanceUuid]);

  // Все инстансы связанного блока
  const allRelatedInstances = useLiveQuery(() =>
          BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock.uuid)
      , [relatedBlock]);

  // Все неиспользованные инстансы для связи
  const unusedRelatedInstances = allRelatedInstances?.filter(instance =>
      !instanceRelations?.some(relation => isInstanceInRelation(instance, relation))
  ) || [];

  // Обработчики действий
  const createRelation = async () => {
    const [source, target] = isRelatedBlockTarget
        ? [blockInstanceUuid, targetInstanceUuid]
        : [targetInstanceUuid, blockInstanceUuid];

    const relation: IBlockInstanceRelation = {
      sourceInstanceUuid: source,
      targetInstanceUuid: target,
      sourceBlockUuid: isRelatedBlockTarget ? blockUuid : relatedBlock.uuid,
      targetBlockUuid: isRelatedBlockTarget ? relatedBlock.uuid : blockUuid,
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
  };

  // Рендер компонентов
  const RelationRow = ({ relation }: { relation: IBlockInstanceRelation }) => {
    const relatedInstanceUuid = isRelatedBlockTarget
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
        <Select
            label={`${relatedParentBlock?.title}`}
            placeholder={`Выберите ${relatedParentBlock?.titleForms?.accusative}`}
            value={parentInstanceUuid}
            data={mapInstancesToOptions(relatedParentInstances)}
            onChange={(v) => {
              setParentInstanceUuid(v || '');
              setTargetInstanceUuid(''); // Сброс дочернего выбора
            }}
            searchable
            clearable
        />

        {parentInstanceUuid && (
            <Select
                label={`${relatedBlock.title}`}
                placeholder={relatedChildInstances?.length ? `Выберите ${relatedBlock.titleForms?.accusative}` : "Нет доступных"}
                value={targetInstanceUuid}
                data={mapInstancesToOptions(relatedChildInstances)}
                onChange={(v) => setTargetInstanceUuid(v || '')}
                disabled={!relatedChildInstances?.length}
                description={!relatedChildInstances?.length && "Нет дочерних элементов"}
                searchable
            />
        )}

        <Group justify="flex-end" mt="md">
          <Button
              onClick={createRelation}
              disabled={!targetInstanceUuid}
              loading={!relatedChildInstances} // Если нужен индикатор загрузки
          >
            Создать связь
          </Button>
        </Group>
      </Stack>
  );

  const DefaultModal = () => (
      <>
        <Select
            label={`Выберите ${relatedBlock?.titleForms?.accusative}`}
            value={targetInstanceUuid}
            data={mapInstancesToOptions(unusedRelatedInstances)}
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
              disabled={!isChildBlock && unusedRelatedInstances.length === 0}
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
