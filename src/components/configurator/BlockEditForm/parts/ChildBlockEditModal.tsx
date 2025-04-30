// ChildBlockEditModal.tsx
import {Modal, Select, Button, Stack, Group} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IBlock } from "@/entities/ConstructorEntities";

interface ChildBlockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockUuid: string, structureKind: string) => void;
  availableBlocks: IBlock[];
  initialData?: { blockUuid?: string; structureKind?: string };
}

const structureKindOptions = [
  { value: 'list', label: 'Список' },
  { value: 'timeLine', label: 'Временная линия' },
];

export const ChildBlockEditModal = ({
                                      isOpen,
                                      onClose,
                                      onSave,
                                      availableBlocks,
                                      initialData,
                                    }: ChildBlockEditModalProps) => {
  const form = useForm({
    initialValues: {
      blockUuid: initialData?.blockUuid || '',
      structureKind: initialData?.structureKind || 'list',
    },
  });

  const handleSave = () => {
    onSave(form.values.blockUuid, form.values.structureKind);
    onClose();
  };

  return (
      <Modal opened={isOpen} onClose={onClose} title={initialData ? "Редактирование блока" : "Добавить дочерний блок"}>
        <Stack>
          <Select
              label="Блок"
              data={availableBlocks.map(b => ({ value: b.uuid!, label: b.title }))}
              {...form.getInputProps('blockUuid')}
              required
          />

          <Select
              label="Тип отображения"
              data={structureKindOptions}
              {...form.getInputProps('structureKind')}
              required
          />

          <Group justify="flex-end">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </Group>
        </Stack>
      </Modal>
  );
};
