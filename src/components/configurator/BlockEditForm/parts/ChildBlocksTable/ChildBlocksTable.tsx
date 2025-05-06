import { Table, ActionIcon, Group, Button, Text } from "@mantine/core";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import {IBlock, IBlockDisplayKind, IBlockDisplayKindTitle} from "@/entities/ConstructorEntities";
import { ChildBlockEditModal } from "./modal/ChildBlockEditModal";
import { useState } from "react";

interface ChildBlocksTableProps {
  childrenBlocks: IBlock[];
  otherBlocks: IBlock[];
  onAddChild: (blockUuid: string, displayKind: string) => void;
  onUpdateChild: (blockUuid: string, displayKind: string) => void;
  onRemoveChild: (blockUuid: string) => void;
}


export const ChildBlocksTable = ({
                                   childrenBlocks,
                                   otherBlocks,
                                   onAddChild,
                                   onUpdateChild,
                                   onRemoveChild,
                                 }: ChildBlocksTableProps) => {
  const [editingBlock, setEditingBlock] = useState<IBlock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const availableBlocks = otherBlocks.filter(
      b => !childrenBlocks.some(child => child.uuid === b.uuid)
  );

  const handleSave = (blockUuid: string, displayKind: string) => {
    if (editingBlock) {
      onUpdateChild(editingBlock.uuid!, displayKind);
    } else {
      onAddChild(blockUuid, displayKind);
    }
    setEditingBlock(null);
  };

  return (
      <div>
        <Group justify="flex-start" mb="md">
          <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => setIsModalOpen(true)}
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
              <Table.Th>Тип отображения</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {childrenBlocks.map((block) => (
                <Table.Tr key={block.uuid}>
                  <Table.Td>{block.title}</Table.Td>
                  <Table.Td>
                    <Text>{IBlockDisplayKindTitle[block.displayKind] || 'Неизвестно'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                          variant="subtle"
                          onClick={() => {
                            setEditingBlock(block);
                            setIsModalOpen(true);
                          }}
                      >
                        <IconEdit size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => onRemoveChild(block.uuid!)}
                      >
                        <IconTrash size="1rem" />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <ChildBlockEditModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingBlock(null);
            }}
            onSave={handleSave}
            availableBlocks={editingBlock ? [...availableBlocks, editingBlock] : availableBlocks}
            initialData={editingBlock ? {
              blockUuid: editingBlock.uuid,
              displayKind: editingBlock.displayKind
            } : undefined}
        />
      </div>
  );
};
