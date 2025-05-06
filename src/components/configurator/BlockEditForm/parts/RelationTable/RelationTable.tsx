import { Table, ActionIcon, Group, Button } from "@mantine/core";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import {IBlock, IBlockRelation} from "@/entities/ConstructorEntities";
import {
  useRelationTable
} from "@/components/configurator/BlockEditForm/parts/RelationTable/hook/useRelationTable";
import {RelationEditModal} from "@/components/configurator/BlockEditForm/parts/RelationTable/modal/RelationEditModal";


interface RelationTableProps {
  otherBlocks: IBlock[]
  block: IBlock
  bookUuid: string
}

export const RelationTable = ({
                                otherBlocks,
                                block,
                                bookUuid
                              }: RelationTableProps) => {

  const {
    blockRelations,
    isModalOpen,
    currentRelation,
    handleOpenModal,
    handleCloseModal,
    saveRelation,
    deleteRelation,
  } = useRelationTable(block, bookUuid);

  const blockCorrespondsToRelation = (block: IBlock, relation: IBlockRelation): boolean => {
    return (relation.targetBlockUuid === block.uuid) ||
        (relation.sourceBlockUuid === block.uuid);
  }

  const rows = blockRelations?.map((relation) => (
      <Table.Tr key={relation.uuid}>
        <Table.Td>{otherBlocks?.find((b) => blockCorrespondsToRelation(b, relation))?.title}</Table.Td>
        <Table.Td>{relation.relationType}</Table.Td>
        <Table.Td>
          <Group gap={4}>
            <ActionIcon
                variant="subtle"
                onClick={() => handleOpenModal(relation)}
            >
              <IconEdit size="1rem" />
            </ActionIcon>
            <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => deleteRelation(relation.uuid!)}
            >
              <IconTrash size="1rem" />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
  ));

  return (
      <div>
        <Group justify="flex-start" mb="md">
          <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => handleOpenModal()}
              size="sm"
              variant="light"
          >
            Добавить связь
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Целевой блок</Table.Th>
              <Table.Th>Тип связи</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>

        {isModalOpen && <RelationEditModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={saveRelation}
            initialData={currentRelation}
            blockUuid={block.uuid}
            otherBlocks={otherBlocks || []}
        />}
      </div>
  );
};
