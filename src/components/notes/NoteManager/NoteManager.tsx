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
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {notifications} from "@mantine/notifications";
import { useUiSettingsStore } from '@/stores/uiSettingsStore/uiSettingsStore';

export const NoteManager = () => {
  const { noteManagerMode, setNoteManagerMode } = useUiSettingsStore();
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Partial<INoteGroup>>({});
  const [currentNote, setCurrentNote] = useState<Partial<INote>>({});
  const {isMobile} = useMedia()

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


  const handleGroupSubmit = async () => {
    if (currentGroup.title) {
      await (currentGroup.uuid ? updateNoteGroup : createNoteGroup)(currentGroup as INoteGroup);
      setGroupModalOpen(false);
    }
  };

  const handleNoteSubmit = async () => {
    if (!currentNote.noteGroupUuid) {
      notifications.show({
        "message": "Выберите папку",
        color: 'orange',
      })
    }
    if (!currentNote.title) {
      notifications.show({
        "message": "Введите название заметки",
        color: 'orange',
      })
    }
    if (currentNote.title && currentNote.noteGroupUuid) {
      await createNote(currentNote as Omit<INote, 'id' | 'uuid'>);
      setNoteModalOpen(false);
    }
  };



  return (
      <Container style={{ background: '#fff', paddingBottom: '2rem', paddingTop: '2rem', minHeight: '60vh'}}>
        <Group justify="space-between" mb="md">
          <Tabs value={noteManagerMode} onChange={(v) => setNoteManagerMode(v as 'folders' | 'list')}>
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
            {noteManagerMode === 'folders' ? 'папка' : 'заметка'}
          </Button>
        </Group>

        {noteManagerMode === 'folders' ? (
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
              <NoteList
                  notes={allNotes}
                  onDelete={deleteNote}
                  onEdit={(note) => navigate(`/notes/edit/${note.uuid}`)}
                  onAdd={() => setNoteModalOpen(true)}
                  showFolderName
              />
            </>
        )}

        {/* Модалка папки */}
        <Modal
            opened={groupModalOpen}
            fullScreen = {isMobile}
            onClose={() => setGroupModalOpen(false)}
            title={currentGroup.uuid ? 'Редактировать папку' : 'Новая папка'}
        >
          <TextInput
              label="Название"
              placeholder="Название папки"
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
            fullScreen = {isMobile}
            onClose={() => setNoteModalOpen(false)}
            title="Новая заметка"
        >
          <TextInput
              label="Название"
              value={currentNote.title || ''}
              placeholder="Название заметки"
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
              mb="md"
          />
          <Text
            style={{
              fontWeight: '500',
              fontSize: '0.8rem',
            }}
          >
            Папка
          </Text>
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
