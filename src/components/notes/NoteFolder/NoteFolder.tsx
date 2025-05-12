import { useParams, useNavigate, Link } from 'react-router-dom';
import {useEffect, useState} from 'react';
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
  Breadcrumbs,
  Divider,
  Badge
} from '@mantine/core';
import { IconFolder, IconPlus, IconEdit, IconTrash, IconNote } from '@tabler/icons-react';
import { useNoteManager } from '../NoteManager/hook/useNoteManager';
import { useLiveQuery } from 'dexie-react-hooks';
import {INote, INoteGroup} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/configuratorDb";

export const NoteFolder = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Partial<INoteGroup>>({});
  const [currentNote, setCurrentNote] = useState<Partial<INote>>({});
  const [breadcrumbs, setBreadcrumbs] = useState<INoteGroup[]>([]);

  const {
    getChildGroups,
    getNotesByGroup,
    createNoteGroup,
    updateNoteGroup,
    deleteNoteGroup,
    createNote,
    deleteNote
  } = useNoteManager();

  const groups = useLiveQuery(() => getChildGroups(folderId || ''), [folderId]) || [];
  const notes = useLiveQuery(() => getNotesByGroup(folderId || ''), [folderId]) || [];
  const currentFolder = useLiveQuery(() =>
      configDatabase.notesGroups.where('uuid').equals(folderId || '').first()
  , [folderId]);

  // Сбор хлебных крошек при изменении текущей папки
  useEffect(() => {
    const fetchBreadcrumbs = async () => {
      const crumbs: INoteGroup[] = [];
      let current = currentFolder;

      while (current && current.parentUuid !== "topLevel") {
        const parent = await configDatabase.notesGroups
        .where('uuid')
        .equals(current.parentUuid)
        .first();

        if (parent) {
          crumbs.unshift(parent);
          current = parent;
        } else {
          break;
        }
      }
      setBreadcrumbs(crumbs);
    };

    if (currentFolder) {
      fetchBreadcrumbs();
    }
  }, [currentFolder]); // Зависимость от currentFolder

  const handleGroupSubmit = async () => {
    if (currentGroup.title) {
      const groupData = {
        ...currentGroup,
        parentUuid: folderId
      };
      await (currentGroup.uuid ? updateNoteGroup : createNoteGroup)(groupData as INoteGroup);
      setGroupModalOpen(false);
    }
  };

  const handleNoteSubmit = async () => {
    if (currentNote.title) {
      await createNote({
        ...currentNote,
        noteGroupUuid: folderId || ''
      } as Omit<INote, 'id' | 'uuid'>);
      setNoteModalOpen(false);
    }
  };

  return (
      <Container>
        <Breadcrumbs mb="md">
          <Button variant="subtle" onClick={() => navigate('/notes')}>
            Главная
          </Button>
          {breadcrumbs.map((folder) => (
              <Button
                  key={folder.uuid}
                  variant="subtle"
                  onClick={() => navigate(`/notes/folder/${folder.uuid}`)}
              >
                {folder.title}
              </Button>
          ))}
          <Text>{currentFolder?.title}</Text>
        </Breadcrumbs>

        <Group justify="space-between" mb="md">
          <Text size="xl">Папка: {currentFolder?.title}</Text>
          <Group>
            <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setGroupModalOpen(true)}
            >
              Новая подпапка
            </Button>
            <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setNoteModalOpen(true)}
            >
              Новая заметка
            </Button>
          </Group>
        </Group>

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

        <Divider my="xl" />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {notes.map(note => (
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
          <Button fullWidth mt="md" onClick={handleNoteSubmit}>
            Создать
          </Button>
        </Modal>
      </Container>
  );
};
