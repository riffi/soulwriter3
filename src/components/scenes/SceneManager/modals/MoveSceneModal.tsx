// src/components/scenes/SceneManager/modals/MoveSceneModal.tsx
import { Modal, Select, Button, Group } from "@mantine/core";
import { useChapters } from "../useChapters";
import {useState} from "react";
import {SceneService} from "@/services/sceneService";
import {ChapterRepository} from "@/repository/Scene/ChapterRepository";
import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IChapter} from "@/entities/BookEntities";

interface MoveSceneModalProps {
  opened: boolean;
  onClose: () => void;
  onMove: (chapterId: number | null) => void;
  currentChapterId?: number;
}

export const MoveSceneModal = ({ opened, onClose, onMove, currentChapterId }: MoveSceneModalProps) => {
  const chapters = useLiveQuery<IChapter[]>(() => ChapterRepository.getAll(bookDb), []);

  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const handleMove = () => {
    const chapterId = selectedChapter === "root" ? null : Number(selectedChapter);
    onMove(chapterId);
    onClose();
  };

  const chapterOptions = [
    { value: "root", label: "Корень (без главы)" },
    ...(chapters?.map(chapter => ({
      value: chapter?.id.toString(),
      label: chapter.title
    }))) || []
  ]

  return (
      <Modal opened={opened} onClose={onClose} title="Перенести сцену">
        <Select
            label="Выберите главу"
            placeholder="Выберите главу"
            data={chapterOptions}
            value={selectedChapter}
            onChange={setSelectedChapter}
            mb="md"
            searchable
        />
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleMove}>
            Перенести
          </Button>
        </Group>
      </Modal>
  );
};
