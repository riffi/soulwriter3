import { useState } from 'react';
import {Table, Button, Group, Select, Modal, Stack, TextInput} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import {IBlock, IBlockRelation} from '@/entities/ConstructorEntities';
import {generateUUID} from "@/utils/UUIDUtils";

interface BlockRelationsEditorProps {
  blockInstanceUuid: string;
  relatedBlock: IBlock;
  blockRelation: IBlockRelation
}

export const BlockRelationsEditor = ({ blockInstanceUuid, relatedBlock, blockRelation }: BlockRelationsEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetInstance, setTargetInstance] = useState<string>('');

  const instanceRelations = useLiveQuery(async () => {
    const [source, target] = await Promise.all([
      bookDb.blockInstanceRelations
      .where('sourceInstanceUuid')
      .equals(blockInstanceUuid)
      .toArray(),
      bookDb.blockInstanceRelations
      .where('targetInstanceUuid')
      .equals(blockInstanceUuid)
      .toArray()
    ]);
    return [...source, ...target];
  }, [blockInstanceUuid]);

  const relatedBlockInstances = useLiveQuery(async () => {
    if (!relatedBlock) return [];
    return bookDb.blockInstances.where('blockUuid').equals(relatedBlock?.uuid).toArray();
  }, [relatedBlock]);


  const handleCreateRelation = async () => {
    if (blockRelation.targetBlockUuid === relatedBlock?.uuid) {
      await bookDb.blockInstanceRelations.add({
        sourceInstanceUuid: blockInstanceUuid,
        targetInstanceUuid: targetInstance,
        blockRelationUuid: generateUUID()
      });
    }
    else{
      await bookDb.blockInstanceRelations.add({
        sourceInstanceUuid: targetInstance,
        targetInstanceUuid: blockInstanceUuid,
        blockRelationUuid: generateUUID()
      });
    }
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
                  ).title}
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
