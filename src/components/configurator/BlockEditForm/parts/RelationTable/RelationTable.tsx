import { Table, ActionIcon, Group, Button } from "@mantine/core";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import {IBlock, IBlockRelation} from "@/entities/ConstructorEntities";
import {IBlockInstance, IBlockInstanceRelation} from "@/entities/BookEntities";


interface RelationTableProps {
  relations: any[];
  onAddRelation: () => void;
  onEditRelation: (relation: any) => void;
  onDeleteRelation: (relationUuid: string) => void;
  otherBlocks: IBlock[]
}

export const RelationTable = ({
                                relations,
                                onAddRelation,
                                onEditRelation,
                                onDeleteRelation,
                                otherBlocks
                              }: RelationTableProps) => {

  const blockCorrespondsToRelation = (block: IBlock, relation: IBlockRelation): boolean => {
    return (relation.targetBlockUuid === block.uuid) ||
        (relation.sourceBlockUuid === block.uuid);
  }

  const rows = relations.map((relation) => (
      <Table.Tr key={relation.uuid}>
        <Table.Td>{otherBlocks?.find((b) => blockCorrespondsToRelation(b, relation))?.title}</Table.Td>
        <Table.Td>{relation.relationType}</Table.Td>
        <Table.Td>
          <Group gap={4}>
            <ActionIcon
                variant="subtle"
                onClick={() => onEditRelation(relation)}
            >
              <IconEdit size="1rem" />
            </ActionIcon>
            <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => onDeleteRelation(relation.uuid)}
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
              onClick={onAddRelation}
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
      </div>
  );
};
