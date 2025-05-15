import { Table, ActionIcon, Group, Button, Text } from "@mantine/core";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import {IBlock, IBlockDisplayKindTitle} from "@/entities/ConstructorEntities";
import { ChildBlockEditModal } from "./modal/ChildBlockEditModal";
import { useState } from "react";
import {
  useChildBlocksManager
} from "@/components/configurator/BlockEditForm/parts/ChildBlocksManager/hook/useChildBlockManager";

interface ChildBlocksManagerProps {
  blockUuid: string;
  bookUuid?: string;
  otherBlocks: IBlock[];
}


export const ChildBlocksManager = ({
                                   blockUuid,
                                   bookUuid,
                                   otherBlocks,
                                 }: ChildBlocksManagerProps) => {
  const [editingBlock, setEditingBlock] = useState<IBlock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    childrenBlocks,
    availableBlocks,
    linkChild,
    updateChildDisplayKind,
    unlinkChild
  } = useChildBlocksManager(blockUuid, bookUuid, otherBlocks);


  const handleSave = async (blockUuid: string, displayKind: string) => {
    if (editingBlock) {
      await updateChildDisplayKind(editingBlock.uuid!, displayKind);
    } else {
      await linkChild(blockUuid, displayKind);
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
            Привязать дочерний блок
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
                          onClick={() => unlinkChild(block.uuid!)}
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
