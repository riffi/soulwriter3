import { Modal, TextInput, Button } from "@mantine/core";
import { useState } from "react";

interface CreateChapterModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

export const CreateChapterModal = ({ opened, onClose, onCreate }: CreateChapterModalProps) => {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    onCreate(title);
    setTitle("");
  };

  return (
      <Modal opened={opened} onClose={onClose} title="Создать новую главу">
        <TextInput
            label="Название главы"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Введите название главы"
            mb="md"
        />
        <Button fullWidth onClick={handleSubmit}>
          Создать
        </Button>
      </Modal>
  );
};
