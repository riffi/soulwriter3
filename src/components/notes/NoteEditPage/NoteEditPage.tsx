import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {TextInput, Button, Container, Group, LoadingOverlay, TagsInput, Paper} from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { configDatabase } from "@/entities/configuratorDb";
import { notifications } from '@mantine/notifications';

export const NoteEditPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<INote | null>(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const loadNote = async () => {
      const data = await configDatabase.notes.where('uuid').equals(uuid!).first();
      if (data) {
        setNote(data);
        setTags(data.tags?.split(',') || []); // Преобразуем строку в массив
      }
      setLoading(false);
    };
    loadNote();
  }, [uuid]);

  const handleSave = async () => {
    if (!note) return;

    await configDatabase.notes.update(note.id!, {
      ...note,
      tags: tags.join(',') // Преобразуем массив в строку
    });

    notifications.show({
      title: 'Сохранено',
      message: 'Изменения успешно сохранены',
      color: 'green'
    });
  };

  if (loading) return <LoadingOverlay visible />;

  return (
      <Container size="xl" p="0">
        <Paper p={"md"}>
        <Button variant="subtle" onClick={() => navigate(-1)}>
          ← Назад к списку
        </Button>

        <TextInput
            label="Название заметки"
            value={note?.title || ''}
            onChange={(e) => setNote({ ...note!, title: e.target.value })}
            mb="md"
        />

        <TagsInput
            label="Теги"
            value={tags}
            onChange={setTags}
            mb="md"
        />

        <RichEditor
            initialContent={note?.body}
            onContentChange={(content) => setNote({ ...note!, body: content })}
        />

        <Group justify="flex-end" mt="md">
          <Button onClick={handleSave}>
            Сохранить
          </Button>
        </Group>
        </Paper>
      </Container>
  );
};

