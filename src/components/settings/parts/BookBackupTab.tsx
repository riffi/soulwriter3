import { useState } from 'react';
import { Button, Group, LoadingOverlay, Select, Text } from '@mantine/core';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import { configDatabase } from '@/entities/configuratorDb';
import { useDialog } from '@/providers/DialogProvider/DialogProvider';
import { notifications } from "@mantine/notifications";
import { connectToBookDatabase, deleteBookDatabase } from '@/entities/bookDb';
import Dexie from 'dexie';

export const BookBackupTab = () => {
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [books, setBooks] = useState<{ value: string; label: string }[]>([]);
  const { showDialog } = useDialog();

  // Загрузка списка книг при монтировании
  useState(() => {
    configDatabase.books.toArray().then(books => {
      setBooks(books.map(book => ({ value: book.uuid, label: book.title })));
    });
  });

  const handleExport = async () => {
    if (!selectedBook) {
      notifications.show({ message: "Выберите книгу", color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const [bookData, db] = await Promise.all([
        configDatabase.books.get({ uuid: selectedBook }),
        connectToBookDatabase(selectedBook)
      ]);

      if (!bookData) throw new Error('Книга не найдена');

      // Экспорт всех данных из bookDb
      const backupData = {
        book: { ...bookData, id: undefined },
        scenes: await db.scenes.toArray(),
        chapters: await db.chapters.toArray(),
        blockInstances: await db.blockInstances.toArray(),
        blockParameterInstances: await db.blockParameterInstances.toArray(),
        blockInstanceRelations: await db.blockInstanceRelations.toArray(),
        bookConfigurations: await db.bookConfigurations.toArray(),
        configurationVersions: await db.configurationVersions.toArray(),
        blocks: await db.blocks.toArray(),
        blockParameterGroups: await db.blockParameterGroups.toArray(),
        blockParameters: await db.blockParameters.toArray(),
        blockParameterPossibleValues: await db.blockParameterPossibleValues.toArray(),
        blocksRelations: await db.blocksRelations.toArray(),
        blockTabs: await db.blockTabs.toArray(),
      };

      const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book-backup-${bookData.title}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      notifications.show({ message: 'Ошибка экспорта', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const data = JSON.parse(event.target?.result as string);

          if (!data?.book?.uuid) {
            throw new Error('Неверный формат файла бэкапа');
          }

          // Обновление/добавление записи книги
          await configDatabase.books.put({ ...data.book, id: undefined });

          // Удаление старой БД и создание новой
          await deleteBookDatabase(data.book.uuid);
          const db = connectToBookDatabase(data.book.uuid);

          // Импорт данных
          await Promise.all([
            db.scenes.bulkAdd(data.scenes || []),
            db.chapters.bulkAdd(data.chapters || []),
            db.blockInstances.bulkAdd(data.blockInstances || []),
            db.blockParameterInstances.bulkAdd(data.blockParameterInstances || []),
            db.blockInstanceRelations.bulkAdd(data.blockInstanceRelations || []),
            db.bookConfigurations.bulkAdd(data.bookConfigurations || []),
            db.configurationVersions.bulkAdd(data.configurationVersions || []),
            db.blocks.bulkAdd(data.blocks || []),
            db.blockParameterGroups.bulkAdd(data.blockParameterGroups || []),
            db.blockParameters.bulkAdd(data.blockParameters || []),
            db.blockParameterPossibleValues.bulkAdd(data.blockParameterPossibleValues || []),
            db.blocksRelations.bulkAdd(data.blocksRelations || []),
            db.blockTabs.bulkAdd(data.blockTabs || [])
          ]);

          notifications.show({ message: "Книга успешно импортирована" });
        };
        reader.readAsText(file);
      } catch (error) {
        showDialog('Ошибка', error.message);
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  return (
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} />

        <Text size="sm" mb="xl">
          Экспорт и импорт полных данных книги. При импорте существующие данные книги будут полностью заменены.
        </Text>

        <Select
            label="Выберите книгу для экспорта"
            data={books}
            value={selectedBook}
            onChange={setSelectedBook}
            mb="md"
        />

        <Group>
          <Button
              leftSection={<IconDownload size={20} />}
              onClick={handleExport}
              variant="filled"
              disabled={!selectedBook}
          >
            Экспортировать книгу
          </Button>

          <Button
              leftSection={<IconUpload size={20} />}
              onClick={handleImport}
              variant="outline"
              color="red"
          >
            Импортировать книгу
          </Button>
        </Group>
      </div>
  );
};
