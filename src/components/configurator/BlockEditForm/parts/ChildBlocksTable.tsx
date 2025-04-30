import { Table, ActionIcon, Group, Button} from "@mantine/core";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { IBlock } from "@/entities/ConstructorEntities";

interface ChildBlocksTableProps {
  childrenBlocks: IBlock[];
  onAddChild: () => void;
  onRemoveChild: (blockUuid: string) => void;
}

export const ChildBlocksTable = ({
                                   childrenBlocks,
                                   onAddChild,
                                   onRemoveChild,
                                 }: ChildBlocksTableProps) => {
  const rows = childrenBlocks.map((block) => (
      <Table.Tr key={block.uuid}>
        <Table.Td>{block.title}</Table.Td>
        <Table.Td>
          <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onRemoveChild(block.uuid!)}
          >
            <IconTrash size="1rem" />
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
  ));

  return (
      <div>
        <Group justify="flex-start" mb="md">
          <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={onAddChild}
              size="sm"
              variant="light"
          >
            Добавить дочерний блок
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название блока</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </div>
  );
};
