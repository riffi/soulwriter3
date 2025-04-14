// BookEditModal.tsx
import { Button, Group, Modal, Select, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IBookConfiguration } from "@/entities/ConstructorEntities";
import {IBook} from "@/entities/BookEntities";

interface BookEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IBook) => void;
  initialData?: IBook;
  configurations: IBookConfiguration[];
}

export const BookEditModal = ({
                                isOpen,
                                onClose,
                                onSave,
                                initialData,
                                configurations,
                              }: BookEditModalProps) => {
  const form = useForm({
    initialValues: initialData || {
      uuid: "",
      title: "",
      author: "",
      kind: "novel",
      configurationUuid: "",
    },
    validate: {
      title: (value) => (value ? null : "Название обязательно"),
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    onSave(values);
    onClose();
  };

  const kindOptions = [
    { value: "novel", label: "Роман" },
    { value: "story", label: "Рассказ" },
    { value: "novella", label: "Повесть" },
    { value: "poem", label: "Поэма" },
    { value: "other", label: "Другое" },
  ];

  const configurationOptions = configurations.map((config) => ({
    value: config.uuid,
    label: config.title,
  }));

  return (
      <Modal
          title={initialData?.uuid ? "Редактирование книги" : "Добавление новой книги"}
          opened={isOpen}
          onClose={onClose}
          size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
              withAsterisk
              label="Название книги"
              placeholder="Введите название"
              {...form.getInputProps("title")}
          />
          <TextInput
              label="Автор"
              placeholder="Введите автора"
              mt="md"
              {...form.getInputProps("author")}
          />
          <Select
              label="Тип"
              placeholder="Выберите тип"
              mt="md"
              data={kindOptions}
              {...form.getInputProps("kind")}
          />
          <Select
              label="Конфигурация"
              placeholder="Выберите конфигурацию"
              mt="md"
              data={configurationOptions}
              {...form.getInputProps("configurationUuid")}
          />
          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </Group>
        </form>
      </Modal>
  );
};
