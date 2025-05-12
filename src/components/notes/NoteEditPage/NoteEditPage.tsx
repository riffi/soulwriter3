import {useCallback, useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  TextInput,
  Button,
  Container,
  Group,
  LoadingOverlay,
  TagsInput,
  Paper,
  Drawer,
  Space, ActionIcon
} from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { configDatabase } from "@/entities/configuratorDb";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {IconSettings} from "@tabler/icons-react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {INote} from "@/entities/BookEntities";
import {InlineTagEdit} from "@/components/shared/InlineEdit/InlineTagEdit";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {NoteRepository} from "@/repository/NoteRepository";


export const NoteEditPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<INote | null>(null);
  const [loading, setLoading] = useState(true);
  const {isMobile} = useMedia();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const { setPageTitle, setTitleElement } = usePageTitle();

  useEffect(() => {
    const loadNote = async () => {
      const data = await NoteRepository.getByUuid(configDatabase, uuid!);
      if (data) {
        setNote(data);
      }
      setLoading(false);
    };
    loadNote();
  }, [uuid]);

  // Управление заголовком через эффект
  useEffect(() => {
    if (note && isMobile) {
      const headerElement = (
          <Group justify="space-between" align="flex-end" flex={2} flexShrink={1}>
            <div style={{ flexGrow: 1 }} /> {/* Пустой элемент для выталкивания кнопки */}
            <ActionIcon
                flexShrink={0}
                variant="subtle"
                color={"gray"}
                onClick={() => setDrawerOpened(true)}
            >
              <IconSettings size={32} />
            </ActionIcon>
          </Group>
      );
      setTitleElement(headerElement);
    } else {
      setTitleElement(null);
    }

    return () => {
      setTitleElement(null); // Очистка при размонтировании
    };
  }, [note, isMobile]); // Зависимости эффекта

  const handleSave = async (data: INote) => {
    if (!data) return;
    await NoteRepository.save(configDatabase, data)
    setNote(data);
  };

  const handleContentChange = useCallback((content: string) => {
    const updated = { ...note!, body: content };
    setNote(updated);
    NoteRepository.save(configDatabase, updated);
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
        <Space mb="sm"/>

        <InlineTagEdit
            label="Теги"
            value={note?.tags?.split(',') || []}
            onChange={async (value) => {
              await handleSave({ ...note!, tags: value.join(',').toLowerCase() })
            }}
            mb="md"
        />
        <Space mb="md"/>
      </>
  );
  return (
      <Container size="xl" p="0">
        <Paper p={"md"}>
          {isMobile ? (
              <>
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
                {top: 50, bottom: 0}
              }
              onContentChange={handleContentChange}
          />
        </Paper>
      </Container>
  );
};

