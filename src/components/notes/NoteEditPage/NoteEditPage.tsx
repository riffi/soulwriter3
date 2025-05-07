import {useCallback, useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {TextInput, Button, Container, Group, LoadingOverlay, TagsInput, Paper, Drawer} from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { configDatabase } from "@/entities/configuratorDb";
import { notifications } from '@mantine/notifications';
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { IconMenu2 } from "@tabler/icons-react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {INote} from "@/entities/BookEntities";

export const NoteEditPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<INote | null>(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const {isMobile} = useMedia();
  const [drawerOpened, setDrawerOpened] = useState(false);

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

  const handleSave = async (data: INote) => {
    if (!data) return;

    await configDatabase.notes.update(data.id!, {
      ...data,
      tags: tags.join(',') // Преобразуем массив в строку
    });
    setNote(data);
  };

  const handleContentChange = useCallback((content: string) => {
    const updated = { ...note!, body: content };
    setNote(updated);
    configDatabase.notes.update(updated.id!, updated);
  }, [note]);


  if (loading) return <LoadingOverlay visible />;

  const headerContent = (
      <>
        <Button variant="subtle" onClick={() => navigate(-1)}>
          ← Назад к списку
        </Button>

        <InlineEdit
            value={note?.title}
            label="Название заметки"
            onChange={async (value) => {
              await handleSave({ ...note!, title: value })
            }}
        />

        <TagsInput
            label="Теги"
            value={tags}
            onChange={setTags}
            mb="md"
        />
      </>
  );
  return (
      <Container size="xl" p="0">
        <Paper p={"md"}>
          {isMobile ? (
              <>
                <Group justify="space-between">
                  <Button leftSection={<IconMenu2 size={18} />} onClick={() => setDrawerOpened(true)}>
                    Меню
                  </Button>
                  <Button onClick={handleSave}>Сохранить</Button>
                </Group>

                <Drawer
                    opened={drawerOpened}
                    onClose={() => setDrawerOpened(false)}
                    title="Редактирование"
                    position="left"
                    size="100%"
                >
                  {headerContent}
                </Drawer>
              </>
          ) : (
              headerContent
          )}

          <RichEditor
              initialContent={note?.body}
              mobileConstraints={
                {top: 120, bottom: 0}
              }
              onContentChange={handleContentChange}
          />

          {!isMobile && (
              <Group justify="flex-end" mt="md">
                <Button onClick={handleSave}>
                  Сохранить
                </Button>
              </Group>
          )}
        </Paper>
      </Container>
  );
};

