import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Group,
  SimpleGrid,
  Card,
  Text,
  ActionIcon,
  Button,
  Modal,
  TextInput,
  TagsInput,
  Select,
  Badge,
  Divider,
  Tabs
} from '@mantine/core';
import { IconFolder, IconList, IconPlus, IconEdit, IconTrash, IconNote } from '@tabler/icons-react';
import { useNoteManager } from './hook/useNoteManager';
import { useLiveQuery } from 'dexie-react-hooks';

export const NoteManager = () => {
  const [mode, setMode] = useState<'folders' | 'list'>('folders');
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Partial<INoteGroup>>({});
  const [currentNote, setCurrentNote] = useState<Partial<INote>>({});
  const [searchTags, setSearchTags] = useState<string[]>([]);

  const {
    getTopLevelGroups,
    getAllNotes,
    createNoteGroup,
    updateNoteGroup,
    deleteNoteGroup,
    createNote,
    deleteNote
  } = useNoteManager();

  const groups = useLiveQuery(getTopLevelGroups) || [];
  const allNotes = useLiveQuery(getAllNotes) || [];
  const navigate = useNavigate();

  const filteredNotes = allNotes.filter(note => {
    const noteTags = note.tags?.split(',') || [];
    return searchTags.every(tag => noteTags.includes(tag));
  });

  const handleGroupSubmit = async () => {
    if (currentGroup.title) {
      await (currentGroup.uuid ? updateNoteGroup : createNoteGroup)(currentGroup as INoteGroup);
      setGroupModalOpen(false);
    }
  };

  const handleNoteSubmit = async () => {
    if (currentNote.title && currentNote.noteGroupUuid) {
      await createNote(currentNote as Omit<INote, 'id' | 'uuid'>);
      setNoteModalOpen(false);
    }
  };

  return (
      <Container>
        <Group justify="space-between" mb="md">
          <Tabs value={mode} onChange={(v) => setMode(v as 'folders' | 'list')}>
            <Tabs.List>
              <Tabs.Tab value="folders" leftSection={<IconFolder size={16} />}>Папки</Tabs.Tab>
              <Tabs.Tab value="list" leftSection={<IconList size={16} />}>Список</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {mode === 'list' && (
              <TagsInput
                  placeholder="Поиск по тегам"
                  value={searchTags}
                  onChange={setSearchTags}
                  style={{ width: 300 }}
              />
          )}

          <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => mode === 'folders'
                  ? setGroupModalOpen(true)
                  : setNoteModalOpen(true)
              }
          >
            {mode === 'folders' ? 'Новая папка' : 'Новая заметка'}
          </Button>
        </Group>

        {mode === 'folders' ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {groups.map(group => (
                  <Card key={group.uuid} shadow="sm" padding="lg">
                    <Group justify="space-between">
                      <Group>
                        <IconFolder size={24} />
                        <Text fw={500}>{group.title}</Text>
                      </Group>
                      <Group gap={4}>
                        <ActionIcon
                            variant="subtle"
                            onClick={() => navigate(`/notes/folder/${group.uuid}`)}
                        >
                          <IconNote size={16} />
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            onClick={() => {
                              setCurrentGroup(group);
                              setGroupModalOpen(true);
                            }}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => deleteNoteGroup(group.uuid)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
              ))}
            </SimpleGrid>
        ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {filteredNotes.map(note => (
                  <Card key={note.uuid} shadow="sm" padding="lg">
                    <Group justify="space-between">
                      <Text fw={500}>{note.title}</Text>
                      <Group gap={4}>
                        <ActionIcon
                            variant="subtle"
                            onClick={() => navigate(`/notes/edit/${note.uuid}`)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => deleteNote(note.uuid)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                    <Divider my="sm" />
                    <Group gap={4}>
                      {note.tags?.split(',').map((tag, i) => (
                          <Badge key={i} variant="light">{tag}</Badge>
                      ))}
                    </Group>
                  </Card>
              ))}
            </SimpleGrid>
        )}

        {/* Модалка папки */}
        <Modal
            opened={groupModalOpen}
            onClose={() => setGroupModalOpen(false)}
            title={currentGroup.uuid ? 'Редактировать папку' : 'Новая папка'}
        >
          <TextInput
              label="Название"
              value={currentGroup.title || ''}
              onChange={(e) => setCurrentGroup({ ...currentGroup, title: e.target.value })}
              mb="md"
          />
          <Button fullWidth onClick={handleGroupSubmit}>
            Сохранить
          </Button>
        </Modal>

        {/* Модалка заметки */}
        <Modal
            opened={noteModalOpen}
            onClose={() => setNoteModalOpen(false)}
            title="Новая заметка"
        >
          <TextInput
              label="Название"
              value={currentNote.title || ''}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
              mb="md"
          />
          <Select
              label="Папка"
              data={groups.map(g => ({ value: g.uuid, label: g.title }))}
              value={currentNote.noteGroupUuid}
              onChange={(value) => setCurrentNote({ ...currentNote, noteGroupUuid: value || '' })}
              mb="md"
          />
          <TagsInput
              label="Теги"
              placeholder="Введите теги через запятую"
              value={currentNote.tags?.split(',') || []}
              onChange={(tags) => setCurrentNote({ ...currentNote, tags: tags.join(',') })}
          />
          <Button fullWidth mt="md" onClick={handleNoteSubmit}>
            Создать
          </Button>
        </Modal>
      </Container>
  );
};
