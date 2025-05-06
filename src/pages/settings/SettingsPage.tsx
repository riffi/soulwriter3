import { useState, useEffect } from 'react';
import { Button, Container, Title, List, Text, LoadingOverlay } from '@mantine/core';
import { IconDatabaseOff, IconTrash } from '@tabler/icons-react';
import Dexie from 'dexie';
import {useDialog} from "@/providers/DialogProvider/DialogProvider";

const SettingsPage = () => {
  const { showDialog } = useDialog();
  const [databases, setDatabases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const dbNames = await Dexie.getDatabaseNames();
      setDatabases(dbNames);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  const handleDelete = async (dbName: string) => {
    const confirmed = await showDialog(
        'Подтверждение удаления',
        `Вы уверены, что хотите удалить базу данных "${dbName}"?`
    );

    if (confirmed) {
      await Dexie.delete(dbName);
      await loadDatabases();
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = await showDialog(
        'Подтверждение удаления',
        'Вы уверены, что хотите удалить ВСЕ базы данных?'
    );

    if (confirmed) {
      await Promise.all(
          databases.map(dbName => Dexie.delete(dbName))
      );
      await loadDatabases();
    }
  };

  return (
      <Container size="md" py="xl">
        <Title order={1} mb="lg">Настройки баз данных</Title>
        <LoadingOverlay visible={loading} />

        {databases.length > 0 && (
            <Button
                color="red"
                onClick={handleDeleteAll}
                leftSection={<IconDatabaseOff size={18} />}
                mb="md"
            >
              Удалить все базы
            </Button>
        )}

        {databases.length === 0 ? (
            <Text c="dimmed">Нет доступных баз данных</Text>
        ) : (
            <List spacing="xs">
              {databases.map(dbName => (
                  <List.Item
                      key={dbName}
                      className="flex items-center justify-between"
                  >
                    <Text>{dbName}</Text>
                    <Button
                        variant="outline"
                        color="red"
                        size="sm"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => handleDelete(dbName)}
                    >
                      Удалить
                    </Button>
                  </List.Item>
              ))}
            </List>
        )}
      </Container>
  );
};

export default SettingsPage;
