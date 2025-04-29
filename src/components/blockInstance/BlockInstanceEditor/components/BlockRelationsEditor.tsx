import { useState } from 'react';
import {Table, Button, Group, Select, Modal, Stack, TextInput} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import {IBlock, IBlockRelation} from '@/entities/ConstructorEntities';
import {generateUUID} from "@/utils/UUIDUtils";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";

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
  };

  return (
      <div>
        <Group justify="space-between" mb="md">
          <Button onClick={() => setIsModalOpen(true)}>Добавить связь</Button>
        </Group>

        <Table>
          <Table.Thead>
          <Table.Tr>
            <Table.Th>{relatedBlock?.title}</Table.Th>
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
              </Table.Tr>
          ))}
          </Table.Tbody>
        </Table>

        <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Добавить связь">
          <Stack>
            <Select
              label="Выберите экземпляр"
              value={targetInstance}
              data={relatedBlockInstances?.map(blockInstance => ({value: blockInstance.uuid, label: `${blockInstance.title}`}))}
              onChange={v => setTargetInstance(v)}
            />
            <Button onClick={handleCreateRelation}>Создать</Button>
          </Stack>
        </Modal>
      </div>
  );
};
