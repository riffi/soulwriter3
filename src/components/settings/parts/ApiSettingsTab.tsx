// components/settings/ApiSettingsTab.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Title,
  Select,
  TextInput,
  Button,
  List,
  ActionIcon,
  Group,
  LoadingOverlay,
  Text
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { InlineEdit } from '@/components/shared/InlineEdit/InlineEdit';
import { configDatabase } from '@/entities/configuratorDb';
import { IGlobalSettings } from '@/entities/ConstructorEntities';
import { useDialog } from '@/providers/DialogProvider/DialogProvider';

interface Model {
  modelName: string;
}

export const ApiSettingsTab = () => {
  const [globalSettings, setGlobalSettings] = useState<IGlobalSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [openRouterModels, setOpenRouterModels] = useState<Model[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const { showDialog } = useDialog();

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

  useEffect(() => {
    loadGlobalSettings();
    loadModels();
  }, []);

  return (
      <Box>
        <Title order={4} mb="md" fw={500}>API Ключи</Title>
        <LoadingOverlay visible={settingsLoading} zIndex={1000} overlayBlur={2} />
        {globalSettings && (
            <>
              <InlineEdit
                  label="Open Router Key"
                  value={globalSettings.openRouterKey}
                  onChange={(v) => handleSaveSettings('openRouterKey', v)}
                  inputProps={{ variant: 'filled' }}
                  mb="md"
              />
              <InlineEdit
                  label="Inc Lumin API Key"
                  value={globalSettings.incLuminApiKey}
                  onChange={(v) => handleSaveSettings('incLuminApiKey', v)}
                  inputProps={{ variant: 'filled' }}
              />

              <Title order={4} my="xl" fw={500}>Модели OpenRouter</Title>
              <Select
                  label="Текущая модель"
                  value={globalSettings.currentOpenRouterModel}
                  onChange={(value) => handleSaveSettings('currentOpenRouterModel', value || '')}
                  data={openRouterModels.map(m => m.modelName)}
                  placeholder="Выберите модель"
                  mb="xl"
              />

              <Group align="flex-end" grow mt="md">
                <TextInput
                    label="Добавить новую модель"
                    placeholder="Введите название модели"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.currentTarget.value)}
                />
                <Button
                    leftSection={<IconPlus size={20} />}
                    onClick={handleAddModel}
                >
                  Добавить
                </Button>
              </Group>
              <Box mt="md">
                {openRouterModels.map(model => (
                    <Group
                        key={model.modelName}
                        justify="space-between"
                        align="center"
                        p={"sm"}
                        className="p-2 bg-gray-50 rounded mb-2"
                    >
                      <Text>{model.modelName}</Text>
                      <ActionIcon
                          color="red"
                          onClick={() => handleDeleteModel(model.modelName)}
                          variant="light"
                          radius="md"
                         >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                ))}
              </Box>
            </>
        )}
      </Box>
  );
};
