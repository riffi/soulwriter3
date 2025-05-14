// Обновлённый файл (если нужно сохранить компонент)
import { useState } from 'react';
import { Button, Group, LoadingOverlay, Select, Text } from '@mantine/core';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import { configDatabase } from '@/entities/configuratorDb';
import { exportBook, handleFileImport } from '@/utils/bookBackupManager';
import {notifications} from "@mantine/notifications";

export const BookBackupTab = () => {
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [books, setBooks] = useState<{ value: string; label: string }[]>([]);

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
    await exportBook(selectedBook);
    setLoading(false);
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
              onClick={() => handleFileImport()}
              variant="outline"
              color="red"
          >
            Импортировать книгу
          </Button>
        </Group>
      </div>
  );
};
