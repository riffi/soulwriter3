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
import { useNoteManager } from '@/components/notes/hook/useNoteManager';
import { useLiveQuery } from 'dexie-react-hooks';
import {FolderList} from "@/components/notes/parts/FolderList";
import {NoteList} from "@/components/notes/parts/NoteList";
import {NoteFolderSelector} from "@/components/notes/parts/NoteFolderSelector";
import {INote, INoteGroup} from "@/entities/BookEntities";

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
    const noteTags = note.tags?.toLowerCase().split(',') || [];
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

  const handleTagClick = (tag: string) => {
    setSearchTags(prev => [...prev, tag.toLowerCase()]);
  };

  return (
      <Container style={{ background: '#fff', paddingBottom: '2rem', paddingTop: '2rem', minHeight: '60vh'}}>
        <Group justify="space-between" mb="md">
          <Tabs value={mode} onChange={(v) => setMode(v as 'folders' | 'list')}>
            <Tabs.List>
              <Tabs.Tab value="folders" leftSection={<IconFolder size={16} />}>Папки</Tabs.Tab>
              <Tabs.Tab value="list" leftSection={<IconList size={16} />}>Список</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => mode === 'folders'
                  ? setGroupModalOpen(true)
                  : setNoteModalOpen(true)
              }
          >
            {mode === 'folders' ? 'папка' : 'заметка'}
          </Button>
        </Group>

        {mode === 'folders' ? (
            <FolderList
                groups={groups}
                onDelete={deleteNoteGroup}
                onEdit={(group) => {
                  setCurrentGroup(group);
                  setGroupModalOpen(true);
                }}
                onNavigate={(uuid) => navigate(`/notes/folder/${uuid}`)}
                onAdd={() => setGroupModalOpen(true)}
                onMove={(group, newParentUuid) => {
                  updateNoteGroup({
                    ...group,
                    parentUuid: newParentUuid
                  } as INoteGroup);
                }}
            />
        ) : (
            <>
              <TagsInput
                  placeholder="Поиск по тегам"
                  value={searchTags}
                  onChange={(tags) => setSearchTags(tags.map(t => t.toLowerCase()))}
                  style={{ width: 300, marginBottom: 16 }}
                  clearable
              />
              <NoteList
                  notes={filteredNotes}
                  onDelete={deleteNote}
                  onEdit={(note) => navigate(`/notes/edit/${note.uuid}`)}
                  onAdd={() => setNoteModalOpen(true)}
                  onTagClick={handleTagClick}
                  showFolderName
              />
            </>
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
          <NoteFolderSelector
              selectedUuid={currentNote?.noteGroupUuid}
              onSelect={(value) => setCurrentNote({ ...currentNote, noteGroupUuid: value })}
          />
          <TagsInput
              label="Теги"
              placeholder="Введите теги через запятую"
              value={currentNote.tags?.split(',') || []}
              onChange={(tags) => setCurrentNote({ ...currentNote, tags: tags.join(',').toLowerCase() })}
          />
          <Button fullWidth mt="md" onClick={handleNoteSubmit}>
            Создать
          </Button>
        </Modal>
      </Container>
  );
};
