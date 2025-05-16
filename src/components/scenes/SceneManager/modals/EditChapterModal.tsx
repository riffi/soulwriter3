import { Modal, TextInput, Button } from "@mantine/core";
import { useState, useEffect } from "react";
import {IChapter} from "@/entities/BookEntities";

interface EditChapterModalProps {
  opened: boolean;
  onClose: () => void;
  chapter: IChapter;
  onUpdate: (title: string) => void;
}

export const EditChapterModal = ({ opened, onClose, chapter, onUpdate }: EditChapterModalProps) => {
  const [title, setTitle] = useState(chapter.title);

  useEffect(() => {
    setTitle(chapter.title);
  }, [chapter.title]);

  const handleSubmit = () => {
    onUpdate(title);
  };

  return (
      <Modal opened={opened} onClose={onClose} title="Редактировать главу">
        <TextInput
            label="Название главы"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Введите новое название главы"
            mb="md"
        />
        <Button fullWidth onClick={handleSubmit}>
          Сохранить
        </Button>
      </Modal>
  );
};
