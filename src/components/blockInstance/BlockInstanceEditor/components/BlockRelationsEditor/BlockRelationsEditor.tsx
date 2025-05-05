import { useState } from 'react';
import { Table, Button, Group, Modal} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import { IBlock, IBlockRelation } from '@/entities/ConstructorEntities';
import { generateUUID } from "@/utils/UUIDUtils";
import { BlockInstanceRepository } from "@/repository/BlockInstanceRepository";
import { IBlockInstance, IBlockInstanceRelation } from "@/entities/BookEntities";
import {BlockRepository} from "@/repository/BlockRepository";
import {
  RelationRow
} from "@/components/blockInstance/BlockInstanceEditor/components/BlockRelationsEditor/RelationRow";
import {
  DefaultModal
} from "@/components/blockInstance/BlockInstanceEditor/components/BlockRelationsEditor/modal/DefaultModal";
import {
  ChildBlockModal
} from "@/components/blockInstance/BlockInstanceEditor/components/BlockRelationsEditor/modal/ChildBlockModal";
import {
  useBlockRelationsEditor
} from "@/components/blockInstance/BlockInstanceEditor/components/BlockRelationsEditor/hook/useBlockRelationsEditor";

interface BlockRelationsEditorProps {
  blockUuid: string;
  blockInstanceUuid: string;
  relatedBlock: IBlock;
  blockRelation: IBlockRelation;
}


export const BlockRelationsEditor = ({
                                       blockInstanceUuid,
                                       relatedBlock,
                                       blockRelation,
                                       blockUuid
                                     }: BlockRelationsEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetInstanceUuid, setTargetInstanceUuid] = useState('');
  const [parentInstanceUuid, setParentInstanceUuid] = useState('');

  const isRelatedBlockChild = !!relatedBlock.parentBlockUuid;
  const isRelatedBlockTarget = blockRelation.targetBlockUuid === relatedBlock?.uuid;

  const {
    relatedParentInstances,
    relatedParentBlock,
    relatedChildInstances,
    instanceRelations,
    allRelatedInstances,
    unusedRelatedInstances,
  } = useBlockRelationsEditor(
      blockInstanceUuid,
      relatedBlock,
      isRelatedBlockTarget,
      isRelatedBlockChild,
      parentInstanceUuid
  );
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


  return (
      <div>
        <Group justify="space-between" mb="md">
          <Button
              onClick={() => setIsModalOpen(true)}
              variant="light"
              disabled={!isRelatedBlockChild && unusedRelatedInstances.length === 0}
          >
            {`Добавить ${relatedBlock?.titleForms?.accusative}`}
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{relatedBlock.title}</Table.Th>
              {isRelatedBlockChild && <Table.Th>{relatedParentBlock?.title}</Table.Th>}
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {instanceRelations?.map(relation =>
                <RelationRow
                    key={relation.blockRelationUuid}
                    relation={relation}
                    relatedParentInstances={relatedParentInstances}
                    isRelatedBlockChild={isRelatedBlockChild}
                    isRelatedBlockTarget = {isRelatedBlockTarget}
                    allRelatedInstances={allRelatedInstances}
                    onDelete={deleteRelation}
                />
            )}
          </Table.Tbody>
        </Table>

        <Modal
            opened={isModalOpen}
            onClose={resetModalState}
            title={`Добавить ${relatedBlock?.titleForms?.accusative}`}
        >
          <>
          {isRelatedBlockChild ? (
              <ChildBlockModal
                  relatedParentBlock={relatedParentBlock}
                  relatedParentInstances={relatedParentInstances}
                  relatedChildInstances={relatedChildInstances}
                  parentInstanceUuid={parentInstanceUuid}
                  targetInstanceUuid={targetInstanceUuid}
                  relatedBlock={relatedBlock}
                  onParentChange={setParentInstanceUuid}
                  onTargetChange={setTargetInstanceUuid}
                  onCreate={createRelation}
                  isLoading={!relatedChildInstances}
              />
          ) : (
              <DefaultModal
                  relatedBlock={relatedBlock}
                  unusedRelatedInstances={unusedRelatedInstances}
                  targetInstanceUuid={targetInstanceUuid}
                  onTargetChange={setTargetInstanceUuid}
                  onCreate={createRelation}
              />
          )}
          </>
        </Modal>
      </div>
  );
};
