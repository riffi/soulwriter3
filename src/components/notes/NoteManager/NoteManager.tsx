import {
  Text,
  ActionIcon,
  Button,
  Card,
  Container,
  Group,
  Space,
  SimpleGrid,
  Anchor,
  Breadcrumbs,
  Modal,
  Badge,
  Group as TagsGroup,
  TextInput, TagsInput, Divider
} from "@mantine/core";
import {
  IconFolder,
  IconPlus,
  IconEdit,
  IconTrash,
  IconNote,
  IconArrowLeft
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useNoteManager } from "./hook/useNoteManager";
import { useState } from "react";
import { notifications } from '@mantine/notifications';


export const NoteManager = () => {
  const { noteGroups, notes, createNoteGroup, updateNoteGroup, deleteNoteGroup, createNote } = useNoteManager();
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({ uuid: '', title: '' });
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]); // Изменено на массив строк
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Функция фильтрации заметок
  const filteredNotes = notes.filter(note => {
    const noteTags = note.tags?.split(',') || [];
    return searchTags.every(tag => noteTags.includes(tag));
  });

  // Функция обработки клика по группе
  const handleGroupClick = (uuid: string) => {
    setActiveGroup(activeGroup === uuid ? null : uuid);
  };

  const handleCreateNote = async () => {
    if (!selectedGroup || !newNoteTitle) return;

    const note = await createNote({
      title: newNoteTitle,
      tags: newNoteTags,
      noteGroupUuid: selectedGroup
    });

    if (note) {
      notifications.show({
        title: 'Успех',
        message: 'Заметка создана',
        color: 'green'
      });
      navigate(`/notes/edit/${note.uuid}`);
    }

    setNoteModalOpen(false);
  };

  return (
      <Container fluid = {activeGroup ? false : true} >
        <h1>Управление заметками</h1>
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          <Anchor href="/">Главная</Anchor>
          <Anchor href="/notes">Заметки</Anchor>
        </Breadcrumbs>

        <Space h={20} />

        <Space h={30} />
        <Group justify="space-between" mb="md">
          {!activeGroup && (
              <Button
                  leftSection={<IconPlus />}
                  onClick={() => {
                    setCurrentGroup({ uuid: '', title: '' });
                    setGroupModalOpen(true);
                  }}
              >
                Новая группа
              </Button>
          )}
          {activeGroup && (
              <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft />}
                  onClick={() => setActiveGroup(null)}
              >
                Назад ко всем группам
              </Button>
          )}
          <TagsInput
              placeholder="Поиск по тегам"
              value={searchTags}
              onChange={setSearchTags}
              style={{ width: 300 }}
              clearable
          />
        </Group>
        <SimpleGrid cols={activeGroup ? 1 : { base: 1, sm: 2, lg: 3, xl: 4 }}>
          {(activeGroup
              ? noteGroups.filter(g => g.uuid === activeGroup)
              : noteGroups).map(group => (
              <Card
                  key={group.uuid}
                  padding="lg"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleGroupClick(group.uuid!)}
              >
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconFolder size={24} />
                    <Text fw={500}>{group.title}</Text>
                  </Group>

                  {activeGroup === group.uuid ? (
                      <ActionIcon
                          variant="subtle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGroup(null);
                          }}
                      >
                        <IconArrowLeft size={20} />
                      </ActionIcon>
                  ) : (
                      <Group gap={4}>
                        <ActionIcon
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentGroup(group);
                              setGroupModalOpen(true);
                            }}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNoteGroup(group.uuid!);
                            }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                  )}
                </Group>

                <Divider my="md" />


                {filteredNotes
                .filter(n => n.noteGroupUuid === group.uuid)
                .map(note => (
                    <Card key={note.uuid}>
                      <Group wrap="nowrap" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Group justify="space-between">
                            <Text fw={500} style={{ lineHeight: 1.2 }} color={"dimmed"}>{note.title}</Text>
                            <ActionIcon
                                variant="subtle"
                                onClick={() => navigate(`/notes/edit/${note.uuid}`)}
                                size="sm"
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Group>

                          {note.tags && (
                              <Group gap={4} mt={6} mb={-4} wrap="wrap">
                                {note.tags.split(',')
                                .filter(tag => tag.trim())
                                .map((tag, index) => (
                                    <Badge
                                        key={index}
                                        variant="light"
                                        color="blue"
                                        size="sm"
                                        radius="sm"
                                    >
                                      {tag.trim()}
                                    </Badge>
                                ))}
                              </Group>
                          )}
                        </div>
                      </Group>
                    </Card>
                ))}

                {!activeGroup && (
                <Button
                    fullWidth
                    variant="outline"
                    mt="md"
                    onClick={() => {
                      setSelectedGroup(group.uuid!);
                      setNoteModalOpen(true);
                    }}
                >
                  Добавить заметку
                </Button>
                )}
              </Card>

          ))}
        </SimpleGrid>

        {/* Модальное окно группы */}
        <Modal
            opened={groupModalOpen}
            onClose={() => setGroupModalOpen(false)}
            title={currentGroup.uuid ? 'Редактировать группу' : 'Новая группа'}
        >
          <TextInput
              label="Название группы"
              value={currentGroup.title}
              onChange={(e) => setCurrentGroup({ ...currentGroup, title: e.target.value })}
              mb="md"
          />
          <Button
              fullWidth
              onClick={async () => {
                await updateNoteGroup(currentGroup);
                setGroupModalOpen(false);
              }}
          >
            Сохранить
          </Button>
        </Modal>

        {/* Модальное окно заметки */}
        <Modal
            opened={noteModalOpen}
            onClose={() => setNoteModalOpen(false)}
            title="Новая заметка"
        >
          <TextInput
              label="Название заметки"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              mb="md"
          />
          <TagsInput
              label="Теги"
              placeholder="Введите теги"
              value={newNoteTags}
              onChange={setNewNoteTags}
              mb="md"
          />
          <Button
              fullWidth
              onClick={handleCreateNote}
          >
            Создать
          </Button>
        </Modal>
      </Container>
  );
};

