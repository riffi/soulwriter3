import { Modal, TextInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { BlockInstanceRepository } from "@/repository/BlockInstanceRepository";
import { bookDb } from "@/entities/bookDb";
import {generateUUID} from "@/utils/UUIDUtils";

interface CreateChildInstanceModalProps {
  opened: boolean;
  onClose: () => void;
  blockUuid: string;
}

export const CreateChildInstanceModal = ({
                                           opened,
                                           onClose,
                                           blockUuid,
                                         }: CreateChildInstanceModalProps) => {
  const form = useForm({
    initialValues: {
      title: "",
    },
    validate: {
      title: (value) => (value.trim() ? null : "Введите название"),
    },
  });

  const handleCreate = async () => {
    await BlockInstanceRepository.create(bookDb, {
      uuid: generateUUID(),
      blockUuid,
      title: form.values.title.trim(),
    });
    onClose();
    form.reset();
  };

  return (
      <Modal opened={opened} onClose={onClose} title="Создать дочерний инстанс">
        <Stack>
          <TextInput
              label="Название инстанса"
              {...form.getInputProps("title")}
              autoFocus
          />
          <Button onClick={handleCreate}>Создать</Button>
        </Stack>
      </Modal>
  );
};
