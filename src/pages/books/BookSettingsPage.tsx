import {Box, Container, Paper, Switch, Title} from "@mantine/core";
import { useLiveQuery } from "dexie-react-hooks";
import { BookSettingsForm } from "@/components/books/BookSettingsForm/BookSettingsForm";
import { useBookStore } from "@/stores/bookStore/bookStore";
import { BookRepository } from "@/repository/Book/BookRepository";
import { configDatabase } from "@/entities/configuratorDb";
import { IBookConfiguration } from "@/entities/ConstructorEntities";
import {Heading} from "tabler-icons-react";
import {notifications} from "@mantine/notifications";

export const BookSettingsPage = () => {
  const { selectedBook, selectBook } = useBookStore();
  const configurations = useLiveQuery<IBookConfiguration[]>(
    () => configDatabase.bookConfigurations.toArray(),
    []
  ) || [];

  const chapterOnlyMode = selectedBook?.chapterOnlyMode === 1;

  const handleToggleChapterOnlyMode = async (value: boolean) => {
    if (!selectedBook) return;
    await BookRepository.update(configDatabase, selectedBook.uuid, {
      chapterOnlyMode: value ? 1 : 0,
    });
    selectBook({ ...selectedBook, chapterOnlyMode: value ? 1 : 0 });
  };

  if (!selectedBook) {
    return null;
  }

  const handleSave = async (data: any) => {
    await BookRepository.update(configDatabase, selectedBook.uuid, data);
    notifications.show({
      title: 'Данные книги обновлены',
    });
    selectBook({ ...selectedBook, ...data });
  };

  return (
    <Container size={900} my="md">
      <Paper>
      <Box p="md">
        <Title order={2} mb={"md"}>Настройки книги</Title>
        <Switch
          label="Не показывать сцены"
          checked={chapterOnlyMode}
          onChange={(e) => handleToggleChapterOnlyMode(e.currentTarget.checked)}
          mb="md"
        />
        <BookSettingsForm
          configurations={configurations}
          initialData={selectedBook}
          onSave={handleSave}
        />
      </Box>
      </Paper>
    </Container>
  );
};
