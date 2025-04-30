import { Modal, Button, Group, Select, Text } from "@mantine/core";
import { IBlock } from "@/entities/ConstructorEntities";

interface ChildBlockAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (blockUuid: string) => void;
  availableBlocks: IBlock[];
}

export const ChildBlockAddModal = ({
                                     isOpen,
                                     onClose,
                                     onAdd,
                                     availableBlocks,
                                   }: ChildBlockAddModalProps) => {
  const handleAdd = (value: string | null) => {
    if (value) {
      onAdd(value);
      onClose();
    }
  };

  return (
      <Modal opened={isOpen} onClose={onClose} title="Добавить дочерний блок">
        {availableBlocks.length === 0 ? (
            <Text>Нет доступных блоков для добавления</Text>
        ) : (
            <Select
                label="Выберите блок"
                placeholder="Начните вводить название"
                data={availableBlocks.map(b => ({ value: b.uuid!, label: b.title }))}
                searchable
                nothingFoundMessage="Блоки не найдены"
                onChange={handleAdd}
            />
        )}
      </Modal>
  );
};
