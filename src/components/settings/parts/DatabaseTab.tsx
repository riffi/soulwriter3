// components/settings/DatabaseTab.tsx
import { useEffect, useState } from 'react';
import Dexie from 'dexie';
import {
  Button,
  Text,
  List,
  ActionIcon,
  Group,
  LoadingOverlay,
  Title, Box
} from '@mantine/core';
import { IconTrash, IconDatabaseOff } from '@tabler/icons-react';
import { useDialog } from '@/providers/DialogProvider/DialogProvider';
import { useBookStore } from '@/stores/bookStore/bookStore';

export const DatabaseTab = () => {
  const [databases, setDatabases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { showDialog } = useDialog();
  const { clearSelectedBook } = useBookStore();

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const dbNames = await Dexie.getDatabaseNames();
      setDatabases(dbNames);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDatabase = async (dbName: string) => {
    const confirmed = await showDialog('Подтверждение удаления', `Вы уверены, что хотите удалить "${dbName}"?`);
    if (confirmed) {
      clearSelectedBook();
      await Dexie.delete(dbName);
      await loadDatabases();
    }
  };

  const handleDeleteAllDatabases = async () => {
    const confirmed = await showDialog('Подтверждение удаления', 'Вы уверены, что хотите удалить все базы данных?');
    if (confirmed) {
      clearSelectedBook();
      await Promise.all(databases.map(dbName => Dexie.delete(dbName)));
      await loadDatabases();
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  return (
      <div>
        <Title order={4} mb="xl" fw={500}>Управление базами данных</Title>
        <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} />
        {!loading && databases.length === 0 && (
            <Text ta="center">Нет доступных баз данных</Text>
        )}
        {!loading && databases.length > 0 && (
            <>
              <Button
                  color="red"
                  leftSection={<IconDatabaseOff size={20} />}
                  onClick={handleDeleteAllDatabases}
                  mb="lg"
                  variant="outline"
              >
                Удалить все базы
              </Button>
              <Box>
                {databases.map((dbName) => (
                    <Group
                        key={dbName}
                        justify="space-between"
                        align="center"
                        className="p-2 bg-gray-50 rounded mb-2"
                        p={"sm"}
                    >
                      <Text>{dbName}</Text>
                      <ActionIcon
                          color="red"
                          onClick={() => handleDeleteDatabase(dbName)}
                          variant="light"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                ))}
              </Box>
            </>
        )}
      </div>
  );
};
