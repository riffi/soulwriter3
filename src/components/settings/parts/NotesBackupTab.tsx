// components/settings/parts/NotesBackupTab.tsx
import { useState } from 'react';
import { Button, Group, LoadingOverlay, Text } from '@mantine/core';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import { configDatabase } from '@/entities/configuratorDb';
import { useDialog } from '@/providers/DialogProvider/DialogProvider';
import { INote, INoteGroup } from '@/entities/BookEntities';
import {notifications} from "@mantine/notifications";

export const NotesBackupTab = () => {
  const [loading, setLoading] = useState(false);
  const { showDialog } = useDialog();

  const handleExport = async () => {
    setLoading(true);
    try {
      const notes = await configDatabase.notes.toArray();
      const noteGroups = await configDatabase.notesGroups.toArray();

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
            await configDatabase.notesGroups.clear();

            // Добавление новых данных
            if (data.notes) await configDatabase.notes.bulkAdd(data.notes);
            if (data.noteGroups) await configDatabase.notesGroups.bulkAdd(data.noteGroups);
          });

          notifications.show({
            message: "Данные импортированы",
          })
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

  return (
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} />

        <Text size="sm" mb="xl">
          Экспорт и импорт всех заметок и групп заметок. При импорте текущие данные будут полностью заменены.
        </Text>

        <Group>
          <Button
              leftSection={<IconDownload size={20} />}
              onClick={handleExport}
              variant="filled"
          >
            Экспортировать все данные
          </Button>

          <Button
              leftSection={<IconUpload size={20} />}
              onClick={handleImport}
              variant="outline"
              color="red"
          >
            Импортировать данные
          </Button>
        </Group>
      </div>
  );
};
