import { useState } from 'react';
import { Table, Button, Group, Modal} from '@mantine/core';
import { bookDb } from '@/entities/bookDb';
import { IBlock, IBlockRelation } from '@/entities/ConstructorEntities';
import { BlockInstanceRepository } from "@/repository/BlockInstance/BlockInstanceRepository";
import { IBlockInstanceRelation } from "@/entities/BookEntities";
import {
  RelationRow
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceRelationsEditor/RelationRow";
import {
  DefaultModal
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceRelationsEditor/modal/DefaultModal";
import {
  ChildBlockModal
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceRelationsEditor/modal/ChildBlockModal";
import {
  useBlockRelationsEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceRelationsEditor/hook/useBlockRelationsEditor";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {BlockInstanceRelationRepository} from "@/repository/BlockInstance/BlockInstanceRelationRepository";

interface BlockRelationsEditorProps {
  blockUuid: string;
  blockInstanceUuid: string;
  relatedBlock: IBlock;
  blockRelation: IBlockRelation;
}


export const InstanceRelationsEditor = ({
                                       blockInstanceUuid,
                                       relatedBlock,
                                       blockRelation,
                                       blockUuid
                                     }: BlockRelationsEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetInstanceUuid, setTargetInstanceUuid] = useState('');
  const [parentInstanceUuid, setParentInstanceUuid] = useState('');

  const isRelatedBlockChild = !!relatedBlock?.parentBlockUuid;
  const isRelatedBlockTarget = blockRelation.targetBlockUuid === relatedBlock?.uuid;
  const {isMobile} = useMedia();
  const {showDialog} = useDialog();


  const {
    relatedParentInstances,
    relatedParentBlock,
    relatedChildInstances,
    instanceRelations,
    allRelatedInstances,
    unusedRelatedInstances,
    createBlockInstanceRelation
  } = useBlockRelationsEditor(
      blockInstanceUuid,
      relatedBlock,
      isRelatedBlockTarget,
      isRelatedBlockChild,
      parentInstanceUuid,
      blockUuid
  );

  if (!relatedBlock) return null

  const handleCreateRelation = async () => {
    await createBlockInstanceRelation(targetInstanceUuid, blockRelation?.uuid);
    resetModalState();
  };

  const deleteRelation = async (relation: IBlockInstanceRelation) =>{
    const result = await showDialog('Внимание', 'Вы действительно хотите удалить связь?')
    if (!result) return
    await BlockInstanceRelationRepository.removeRelation(bookDb, relation);
  }


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
            fullscreen={isMobile}
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
                  onCreate={handleCreateRelation}
                  isLoading={!relatedChildInstances}
              />
          ) : (
              <DefaultModal
                  relatedBlock={relatedBlock}
                  unusedRelatedInstances={unusedRelatedInstances}
                  targetInstanceUuid={targetInstanceUuid}
                  onTargetChange={setTargetInstanceUuid}
                  onCreate={handleCreateRelation}
              />
          )}
          </>
        </Modal>
      </div>
  );
};
