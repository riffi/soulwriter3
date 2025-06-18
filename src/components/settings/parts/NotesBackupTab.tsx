// components/settings/parts/NotesBackupTab.tsx
import { useState } from 'react';
import { Button, Group, LoadingOverlay, Text, Stack, Divider } from '@mantine/core';
import { IconDownload, IconUpload, IconCloud, IconCloudDownload } from '@tabler/icons-react';
import { configDatabase } from '@/entities/configuratorDb';
import { useDialog } from '@/providers/DialogProvider/DialogProvider';
import { INote, INoteGroup } from '@/entities/BookEntities';
import { exportDB, importDB } from 'dexie-export-import';
import { notifications } from "@mantine/notifications";
import {useAuth} from "@/providers/AuthProvider/AuthProvider";
import { NoteGroupRepository } from "@/repository/Note/NoteGroupRepository";

export const NotesBackupTab = () => {
  const [loading, setLoading] = useState(false);
  const { showDialog } = useDialog();
  const { user, saveConfigToServer, getConfigFromServer } = useAuth();

  const handleExport = async () => {
    setLoading(true);
    try {
      const notes = await configDatabase.notes.toArray();
      const noteGroups = await NoteGroupRepository.getAll(configDatabase);

      const backupData = {
        notes,
        noteGroups,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      notifications.show({
        message: "Данные экспортированы в файл",
        color: "green"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const confirmed = await showDialog(
        'Подтверждение импорта',
        'Все текущие заметки и группы будут удалены. Продолжить?'
    );

    if (!confirmed) return;

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

          await configDatabase.transaction('rw', configDatabase.notes, configDatabase.notesGroups, async () => {
            // Очистка существующих данных
            await configDatabase.notes.clear();
            await NoteGroupRepository.clear(configDatabase);

            // Добавление новых данных
            if (data.notes) await configDatabase.notes.bulkAdd(data.notes);
            if (data.noteGroups) await NoteGroupRepository.bulkAdd(configDatabase, data.noteGroups as INoteGroup[]);
          });

          notifications.show({
            message: "Данные импортированы из файла",
            color: "green"
          });
        };
        reader.readAsText(file);
      } catch (error) {
        showDialog('Ошибка', 'Неверный формат файла бэкапа');
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  const handleSaveToServer = async () => {
    if (!user) {
      notifications.show({
        message: "Необходимо войти в систему",
        color: "red"
      });
      return;
    }

    setLoading(true);
    try {
      // Экспорт всей базы данных
      const blob = await exportDB(configDatabase, {
        prettyJson: true,
        numRowsPerChunk: 2000
      });

      // Конвертация Blob в ArrayBuffer
      const buffer = await blob.arrayBuffer();
      const uintArray = new Uint8Array(buffer);

      const base64Data = btoa(String.fromCharCode(...uintArray));

      const result = await saveConfigToServer({ data: base64Data });

      if (result.success) {
        notifications.show({
          message: "Данные сохранены на сервер",
          color: "green"
        });
      } else {
        notifications.show({
          message: result.message || "Ошибка сохранения на сервер",
          color: "red"
        });
      }
    } catch (error) {
      notifications.show({
        message: "Ошибка при сохранении данных",
        color: "red"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromServer = async () => {
    if (!user) {
      notifications.show({
        message: "Необходимо войти в систему",
        color: "red"
      });
      return;
    }

    const confirmed = await showDialog(
        'Подтверждение загрузки',
        'Все локальные данные будут заменены данными с сервера. Продолжить?'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await getConfigFromServer();

      if (result.success && result.data.data) {
        // Декодирование Base64 через бинарные операции
        const binaryString = atob(result.data.data);
        const buffer = new ArrayBuffer(binaryString.length);
        const view = new Uint8Array(buffer);

        for (let i = 0; i < binaryString.length; i++) {
          view[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([buffer], { type: 'application/json' });

        await importDB(blob, {
          clearTablesBeforeImport: true,
          acceptVersionDiff: true
        });

        notifications.show({
          message: "Данные загружены с сервера",
          color: "green"
        });
      } else {
        notifications.show({
          message: result.message || "Ошибка загрузки с сервера",
          color: "red"
        });
      }
    } catch (error) {
      notifications.show({
        message: "Ошибка при загрузке данных: " + error,
        color: "red"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} />

        <Stack gap="xl">
          {/* Локальный бэкап */}
          <div>
            <Text size="lg" fw={500} mb="sm">
              Локальный бэкап
            </Text>
            <Text size="sm" mb="md" c="dimmed">
              Экспорт и импорт данных в виде файла. При импорте текущие данные будут полностью заменены.
            </Text>

            <Group>
              <Button
                  leftSection={<IconDownload size={20} />}
                  onClick={handleExport}
                  variant="filled"
              >
                Экспортировать в файл
              </Button>

              <Button
                  leftSection={<IconUpload size={20} />}
                  onClick={handleImport}
                  variant="outline"
                  color="red"
              >
                Импортировать из файла
              </Button>
            </Group>
          </div>

          <Divider />

          {/* Облачный бэкап */}
          <div>
            <Text size="lg" fw={500} mb="sm">
              Облачная синхронизация
            </Text>
            <Text size="sm" mb="md" c="dimmed">
              Сохранение и восстановление данных на сервере.
              {!user && ' Требуется авторизация.'}
            </Text>

            <Group>
              <Button
                  leftSection={<IconCloud size={20} />}
                  onClick={handleSaveToServer}
                  variant="filled"
                  color="blue"
                  disabled={!user}
              >
                Сохранить на сервер
              </Button>

              <Button
                  leftSection={<IconCloudDownload size={20} />}
                  onClick={handleLoadFromServer}
                  variant="outline"
                  color="orange"
                  disabled={!user}
              >
                Загрузить с сервера
              </Button>
            </Group>

            {!user && (
                <Text size="xs" c="red" mt="xs">
                  Войдите в систему для использования облачной синхронизации
                </Text>
            )}
          </div>
        </Stack>
      </div>
  );
};
