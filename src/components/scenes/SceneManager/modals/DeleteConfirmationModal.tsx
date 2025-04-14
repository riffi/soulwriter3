import { Modal, Text, Button, Group } from "@mantine/core";

interface DeleteConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const DeleteConfirmationModal = ({
                                          opened,
                                          onClose,
                                          onConfirm,
                                          title,
                                          message,
                                        }: DeleteConfirmationModalProps) => {
  return (
      <Modal opened={opened} onClose={onClose} title={title} centered>
        <Text mb="xl">{message}</Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button color="red" onClick={onConfirm}>
            Удалить
          </Button>
        </Group>
      </Modal>
  );
};
