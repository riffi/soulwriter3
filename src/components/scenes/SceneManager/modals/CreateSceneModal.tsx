import { Modal, TextInput, Button } from "@mantine/core";
import { useState } from "react";

interface CreateSceneModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

export const CreateSceneModal = ({ opened, onClose, onCreate }: CreateSceneModalProps) => {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    onCreate(title);
    setTitle("");
  };

  return (
      <Modal opened={opened} onClose={onClose} title="Создать новую сцену">
        <TextInput
            label="Название сцены"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Введите название сцены"
            mb="md"
        />
        <Button fullWidth onClick={handleSubmit}>
          Создать
        </Button>
      </Modal>
  );
};
