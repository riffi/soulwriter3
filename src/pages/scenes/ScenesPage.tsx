import { SceneLayout } from "@/components/scenes/SceneLayout/SceneLayout";
import { Switch, Box } from "@mantine/core";
import { useBookStore } from "@/stores/bookStore/bookStore";
import { BookRepository } from "@/repository/Book/BookRepository";
import { configDatabase } from "@/entities/configuratorDb";


export const ScenesPage = () => {
  const { selectedBook, selectBook } = useBookStore();
  const chapterOnlyMode = selectedBook?.chapterOnlyMode === 1;

  const handleToggleChapterOnlyMode = async (value: boolean) => {
    if (!selectedBook) return;
    await BookRepository.update(configDatabase, selectedBook.uuid, {
      chapterOnlyMode: value ? 1 : 0,
    });
    selectBook({ ...selectedBook, chapterOnlyMode: value ? 1 : 0 });
  };

  return (
      <Box p="md">
        <Switch
            label="Только главы"
            checked={chapterOnlyMode}
            onChange={(e) => handleToggleChapterOnlyMode(e.currentTarget.checked)}
            mb="md"
        />
        <SceneLayout />
      </Box>
  );
};
