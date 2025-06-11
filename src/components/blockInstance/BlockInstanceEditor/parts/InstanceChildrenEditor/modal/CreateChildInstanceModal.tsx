import { Modal, TextInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
// import { BlockInstanceRepository } from "@/repository/BlockInstance/BlockInstanceRepository"; // To be removed
// import { bookDb } from "@/entities/bookDb"; // To be removed
// import {generateUUID} from "@/utils/UUIDUtils"; // UUID generation is now in the hook
import {IBlock, IBlockStructureKind} from "@/entities/ConstructorEntities"; // Added IBlockStructureKind
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { useChildInstanceMutations } from "@/components/blockInstance/BlockInstanceEditor/hooks/useChildInstanceMutations"; // Import new hook

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
  const { addChildInstance } = useChildInstanceMutations(); // Use the hook

  const form = useForm({
    initialValues: {
      title: "",
    },
    validate: {
      title: (value) => (value.trim() ? null : "Введите название"),
    },
  });

  const handleCreate = async () => {
    if (form.validate().hasErrors) {
      return;
    }
    try {
      // The hook's addChildInstance expects:
      // parentBlockInstanceUuid: string,
      // childBlockUuid: string,
      // title: string,
      // structureKind: IBlockStructureKind
      await addChildInstance(
        blockInstanceUuid,      // parentBlockInstanceUuid
        relatedBlock.uuid,      // childBlockUuid
        form.values.title.trim(),
        relatedBlock.structureKind // structureKind from relatedBlock
      );
      onClose();
      form.reset();
    } catch (error) {
      console.error("Failed to create child instance:", error);
      // Add user notification if necessary
    }
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
