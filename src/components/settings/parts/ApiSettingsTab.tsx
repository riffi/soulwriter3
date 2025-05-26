import { useState } from 'react';
import {
  Box,
  Title,
  Select,
  TextInput,
  Button,
  ActionIcon,
  Group,
  LoadingOverlay,
  Text
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { InlineEdit } from '@/components/shared/InlineEdit/InlineEdit';
import { useDialog } from '@/providers/DialogProvider/DialogProvider';
import {useApiSettingsStore} from "@/stores/apiSettingsStore/apiSettingsStore";

export const ApiSettingsTab = () => {
  const [newModelName, setNewModelName] = useState('');
  const { showDialog } = useDialog();

  const {
    openRouterKey,
    incLuminApiKey,
    currentOpenRouterModel,
    openRouterModels,
    isLoading,
    setOpenRouterKey,
    setIncLuminApiKey,
    setCurrentOpenRouterModel,
    addModel,
    deleteModel,
  } = useApiSettingsStore();

  const handleAddModel = () => {
    if (newModelName.trim()) {
      addModel(newModelName.trim());
      setNewModelName('');
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    const confirmed = await showDialog(
        'Подтверждение удаления',
        `Вы уверены, что хотите удалить модель "${modelName}"?`
    );
    if (confirmed) {
      deleteModel(modelName);
    }
  };

  return (
      <Box>
        <Title order={4} mb="md" fw={500}>API Ключи</Title>
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayBlur={2} />

        <InlineEdit
            label="Open Router Key"
            value={openRouterKey}
            onChange={setOpenRouterKey}
            inputProps={{ variant: 'filled' }}
            mb="md"
        />

        <InlineEdit
            label="Inc Lumin API Key"
            value={incLuminApiKey}
            onChange={setIncLuminApiKey}
            inputProps={{ variant: 'filled' }}
        />

        <Title order={4} my="xl" fw={500}>Модели OpenRouter</Title>

        <Select
            label="Текущая модель"
            value={currentOpenRouterModel}
            onChange={(value) => setCurrentOpenRouterModel(value || '')}
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
              onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
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
                  p="sm"
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
      </Box>
  );
};
