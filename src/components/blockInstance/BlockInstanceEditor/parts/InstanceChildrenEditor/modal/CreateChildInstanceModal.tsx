import { Modal, TextInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { BlockInstanceRepository } from "@/repository/BlockInstance/BlockInstanceRepository";
import { bookDb } from "@/entities/bookDb";
import {generateUUID} from "@/utils/UUIDUtils";
import {IBlock} from "@/entities/ConstructorEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

interface CreateChildInstanceModalProps {
  opened: boolean;
  onClose: () => void;
  blockUuid: string;
  blockInstanceUuid: string;
  relatedBlock: IBlock;
}

export const CreateChildInstanceModal = ({
                                           opened,
                                           onClose,
                                           blockInstanceUuid,
                                           relatedBlock
                                         }: CreateChildInstanceModalProps) => {

  const {isMobile} = useMedia();
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
      blockUuid: relatedBlock.uuid,
      title: form.values.title.trim(),
      parentInstanceUuid: blockInstanceUuid
    });
    onClose();
    form.reset();
  };

  return (
      <Modal
          opened={opened}
          onClose={onClose}
          title={`Добавить ${relatedBlock?.title}`}
          fullScreen={isMobile}
      >
        <Stack>
          <TextInput
              label="Название"
              {...form.getInputProps("title")}
              autoFocus
          />
          <Button onClick={handleCreate}>Создать</Button>
        </Stack>
      </Modal>
  );
};
