import { useState, useEffect } from 'react';
import {
  Button,
  Container,
  Title,
  List,
  Text,
  LoadingOverlay,
  Tabs,
  TextInput,
  Group, Select
} from '@mantine/core';
import {IconDatabaseOff, IconTrash, IconSettings, IconPlus} from '@tabler/icons-react';
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
  const [openRouterModels, setOpenRouterModels] = useState<{ modelName: string }[]>([]);
  const [newModelName, setNewModelName] = useState('');

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
      setGlobalSettings(settings || {
        openRouterKey: '',
        incLuminApiKey: '',
        currentOpenRouterModel: ''
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Загрузка моделей Open Router
  const loadModels = async () => {
    const models = await configDatabase.openRouterModels.toArray();
    setOpenRouterModels(models);
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
    loadModels();
  }, []);

  // Добавление новой модели
  const handleAddModel = async () => {
    if (newModelName.trim()) {
      await configDatabase.openRouterModels.add({ modelName: newModelName.trim() });
      setNewModelName('');
      await loadModels();
    }
  };

  // Удаление модели
  const handleDeleteModel = async (modelName: string) => {
    const confirmed = await showDialog(
        'Подтверждение удаления',
        `Вы уверены, что хотите удалить модель "${modelName}"?`
    );

    if (confirmed) {
      await configDatabase.openRouterModels.where('modelName').equals(modelName).delete();
      if (globalSettings?.currentOpenRouterModel === modelName) {
        await handleSaveSettings('currentOpenRouterModel', '');
      }
      await loadModels();
    }
  };

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
                  <Select
                      label="Текущая модель Open Router"
                      value={globalSettings.currentOpenRouterModel}
                      onChange={(value) => handleSaveSettings('currentOpenRouterModel', value || '')}
                      data={openRouterModels.map(m => m.modelName)}
                      placeholder="Выберите модель"
                      mb="md"
                  />

                  <Title order={3} mb="sm">Управление моделями</Title>

                  <Group mb="md">
                    <TextInput
                        placeholder="Название модели"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.currentTarget.value)}
                    />
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={handleAddModel}
                    >
                      Добавить
                    </Button>
                  </Group>

                  <List spacing="xs">
                    {openRouterModels.map(model => (
                        <List.Item
                            key={model.modelName}
                            className="flex items-center justify-between"
                        >
                          <Text>{model.modelName}</Text>
                          <Button
                              variant="outline"
                              color="red"
                              size="sm"
                              leftSection={<IconTrash size={16} />}
                              onClick={() => handleDeleteModel(model.modelName)}
                          >
                            Удалить
                          </Button>
                        </List.Item>
                    ))}
                  </List>
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
