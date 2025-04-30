import {Modal, Button, Group, Select, Text, Stack} from "@mantine/core";
import { IBlock } from "@/entities/ConstructorEntities";
import {useState} from "react";

interface ChildBlockAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (blockUuid: string , structureKind: string) => void;
  availableBlocks: IBlock[];
}

export const ChildBlockAddModal = ({
                                     isOpen,
                                     onClose,
                                     onAdd,
                                     availableBlocks,
                                   }: ChildBlockAddModalProps) => {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState('list');

  const handleAdd = () => {
    if (selectedBlock) {
      onAdd(selectedBlock, selectedStructure);
      onClose();
      setSelectedBlock(null);
      setSelectedStructure('list');
    }
  };

  return (
      <Modal opened={isOpen} onClose={onClose} title="Добавить дочерний блок">
        <Stack gap="md">
          <Select
              label="Выберите блок"
              placeholder="Начните вводить название"
              data={availableBlocks.map(b => ({ value: b.uuid!, label: b.title }))}
              searchable
              nothingFoundMessage="Блоки не найдены"
              value={selectedBlock}
              onChange={setSelectedBlock}
              required
          />

          {selectedBlock && (
              <Select
                  label="Вид отображения"
                  value={selectedStructure}
                  onChange={setSelectedStructure}
                  data={[
                    { value: 'list', label: 'Список' },
                    { value: 'timeLine', label: 'Временная линия' },
                  ]}
                  required
              />
          )}

          <Group justify="flex-end">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleAdd} disabled={!selectedBlock}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Modal>
  );
};
