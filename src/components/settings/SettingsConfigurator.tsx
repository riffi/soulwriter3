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
  ActionIcon,
  Group, Select, rem, Paper, Box, Divider
} from '@mantine/core';
import {IconDatabaseOff, IconTrash, IconSettings, IconPlus} from '@tabler/icons-react';
import Dexie from 'dexie';
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import {IGlobalSettings} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {useBookStore} from "@/stores/bookStore/bookStore";

const SettingsConfigurator = () => {
  const { showDialog } = useDialog();
  const [databases, setDatabases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<IGlobalSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [openRouterModels, setOpenRouterModels] = useState<{ modelName: string }[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const { selectedBook, clearSelectedBook } = useBookStore();

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const dbNames = await Dexie.getDatabaseNames();
      setDatabases(dbNames);
    } finally {
      setLoading(false);
    }
  };

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

  const loadModels = async () => {
    const models = await configDatabase.openRouterModels.toArray();
    setOpenRouterModels(models);
  };

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

  const handleAddModel = async () => {
    if (newModelName.trim()) {
      await configDatabase.openRouterModels.add({ modelName: newModelName.trim() });
      setNewModelName('');
      await loadModels();
    }
  };

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
      clearSelectedBook()
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
      clearSelectedBook()
      await Promise.all(databases.map(dbName => Dexie.delete(dbName)));
      await loadDatabases();
    }
  };

  return (
      <Container size="md" py="xl">
        <Paper
            p="lg"
            shadow="sm"
            radius="md"
            style={{backgroundColor: 'white'}}
        >
          <Title order={2} mb="xl" fw={600} c="dark.4">
            <IconSettings style={{ marginRight: rem(12), width: rem(28), height: rem(28) }} />
            Настройки системы
          </Title>

          <Tabs defaultValue="settings">
            <Tabs.List>
              <Tabs.Tab
                  value="settings"
                  icon={<IconSettings size={18} />}
                  style={{fontSize: rem(16), padding: rem(16)}}
              >
                Настройки API
              </Tabs.Tab>
              <Tabs.Tab
                  value="databases"
                  icon={<IconDatabaseOff size={18} />}
                  style={{fontSize: rem(16), padding: rem(16)}}
              >
                Управление БД
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="settings" pt="lg">
              <LoadingOverlay visible={settingsLoading} zIndex={1000} overlayBlur={2} />

              {globalSettings && (
                  <Box>
                      <Title order={4} mb="md" c="dimmed" fw={500}>API Ключи</Title>
                        <InlineEdit
                            label="Open Router Key"
                            value={globalSettings.openRouterKey}
                            onChange={(v) => handleSaveSettings('openRouterKey', v)}
                            inputProps={{
                              variant: "filled",
                              radius: "md",
                            }}
                            mb="md"
                        />

                        <InlineEdit
                            label="Inc Lumin API Key"
                            value={globalSettings.incLuminApiKey}
                            onChange={(v) => handleSaveSettings('incLuminApiKey', v)}
                            inputProps={{
                              variant: "filled",
                              radius: "md",
                            }}
                        />

                    <Divider my="xl" />

                    <Box>
                      <Title order={4} mb="md" c="dimmed" fw={500}>Модели OpenRouter</Title>
                        <Select
                            label="Текущая модель"
                            value={globalSettings.currentOpenRouterModel}
                            onChange={(value) => handleSaveSettings('currentOpenRouterModel', value || '')}
                            data={openRouterModels.map(m => m.modelName)}
                            placeholder="Выберите модель"
                            variant="filled"
                            radius="md"
                            mb="xl"
                        />

                        <Group align="flex-end" grow>
                          <TextInput
                              placeholder="Введите название модели"
                              value={newModelName}
                              onChange={(e) => setNewModelName(e.currentTarget.value)}
                              variant="filled"
                              radius="md"
                              label="Добавить новую модель"
                          />
                          <Button
                              leftSection={<IconPlus size={20} />}
                              onClick={handleAddModel}
                              radius="md"
                              h={42}
                          >
                            Добавить
                          </Button>
                        </Group>

                        <List spacing="xs" mt="md">
                          {openRouterModels.map(model => (
                              <List.Item
                                  key={model.modelName}
                                  className="flex items-center justify-between"
                                  py={8}
                                  px={12}
                                  mb={4}
                              >
                                <Text fw={500}>{model.modelName}</Text>
                                <Button
                                    variant="light"
                                    color="red"
                                    size="sm"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={() => handleDeleteModel(model.modelName)}
                                    radius="md"
                                >
                                  Удалить
                                </Button>
                              </List.Item>
                          ))}
                        </List>
                    </Box>
                  </Box>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="databases" pt="lg">
              <Box maw={800}>
                <Title order={4} mb="xl" c="dimmed" fw={500}>Управление базами данных</Title>
                <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} />

                {databases.length > 0 && (
                    <Button
                        color="red"
                        onClick={handleDeleteAll}
                        leftSection={<IconDatabaseOff size={20} />}
                        radius="md"
                        mb="md"
                        variant="outline"
                    >
                      Удалить все базы
                    </Button>
                )}

                {databases.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">Нет доступных баз данных</Text>
                ) : (
                    <List spacing={4}>
                      {databases.map(dbName => (
                          <Group>
                            <Text fw={500} style={{flexGrow: 1}}>{dbName}</Text>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => handleDelete(dbName)}
                              radius="md">
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                      ))}
                    </List>
                )}
              </Box>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>
  );
};

export default SettingsConfigurator;
