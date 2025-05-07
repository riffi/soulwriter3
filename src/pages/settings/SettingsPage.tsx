import { useState, useEffect } from 'react';
import { Button, Container, Title, List, Text, LoadingOverlay, Tabs } from '@mantine/core';
import { IconDatabaseOff, IconTrash, IconSettings } from '@tabler/icons-react';
import Dexie from 'dexie';
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import {IGlobalSettings} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";


const SettingsPage = () => {
  const { showDialog } = useDialog();
  const [databases, setDatabases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<IGlobalSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Загрузка списка баз данных
  const loadDatabases = async () => {
    try {
      setLoading(true);
      const dbNames = await Dexie.getDatabaseNames();
      setDatabases(dbNames);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка глобальных настроек
  const loadGlobalSettings = async () => {
    try {
      setSettingsLoading(true);
      const settings = await configDatabase.globalSettings.get(1);
      setGlobalSettings(settings || { openRouterKey: '', incLuminApiKey: '' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Сохранение настроек
  const handleSaveSettings = async (field: keyof IGlobalSettings, value: string) => {
    const updatedSettings = { ...globalSettings, [field]: value } as IGlobalSettings;
    await configDatabase.globalSettings.put(updatedSettings, 1);
    setGlobalSettings(updatedSettings);
  };

  useEffect(() => {
    loadDatabases();
    loadGlobalSettings();
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
      await Promise.all(databases.map(dbName => Dexie.delete(dbName)));
      await loadDatabases();
    }
  };

  return (
      <Container size="md" py="xl" style={{backgroundColor: 'white'}}>
        <Title order={1} mb="lg">Настройки системы</Title>

        <Tabs defaultValue="settings">
          <Tabs.List>
            <Tabs.Tab value="settings" icon={<IconSettings size={14} />}>Настройки</Tabs.Tab>
            <Tabs.Tab value="databases" icon={<IconDatabaseOff size={14} />}>Управление БД</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="settings" pt="md">
            <LoadingOverlay visible={settingsLoading} />

            {globalSettings && (
                <div style={{ maxWidth: 500 }}>
                  <InlineEdit
                      label="Open Router Key"
                      value={globalSettings.openRouterKey}
                      onChange={(v) => handleSaveSettings('openRouterKey', v)}
                      inputProps={{ style: { width: '100%' } }}
                      mb="md"
                  />

                  <InlineEdit
                      label="Inc Lumin API Key"
                      value={globalSettings.incLuminApiKey}
                      onChange={(v) => handleSaveSettings('incLuminApiKey', v)}
                      inputProps={{ style: { width: '100%' } }}
                  />
                </div>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="databases" pt="md">
            <Title order={2} mb="lg">Управление базами данных</Title>
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
          </Tabs.Panel>
        </Tabs>
      </Container>
  );
};

export default SettingsPage;
