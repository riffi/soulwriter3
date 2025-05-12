import {
  Table,
  Group,
  Badge,
  ActionIcon,
  Text,
  Modal,
  Button,
  TagsInput, SegmentedControl, Drawer, Stack
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconArrowRightCircleFilled,
  IconCalendar,
  IconSortAZ, IconDots
} from '@tabler/icons-react';
import { INote } from '@/entities/BookEntities';
import {useState} from "react";
import {useNoteManager} from "@/components/notes/hook/useNoteManager";
import {NoteFolderSelector} from "@/components/notes/parts/NoteFolderSelector";
import {useLiveQuery} from "dexie-react-hooks";
import {configDatabase} from "@/entities/configuratorDb";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { useUiSettingsStore } from '@/stores/uiSettingsStore/uiSettingsStore';

interface NoteListProps {
  notes: INote[];
  onEdit: (note: INote) => void;
  onDelete: (uuid: string) => void;
  onAdd: () => void;
  showFolderName?: boolean;
  selectedFolderUuid?: string;
}

export const NoteList = ({ notes, onEdit, onDelete, onAdd, selectedFolderUuid, showFolderName  }: NoteListProps) => {
  const [movingNote, setMovingNote] = useState<INote | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const { notesSortType, setNotesSortType } = useUiSettingsStore();
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [expandedNoteUuid, setExpandedNoteUuid] = useState<string | null>(null);
  const [openedDrawerId, setOpenedDrawerId] = useState<string | null>(null);

  const { updateNote} = useNoteManager();
  const {isMobile} = useMedia()
  // Получаем все группы заметок
  const allGroups = useLiveQuery(() => configDatabase.notesGroups.toArray(), [notes]) || [];


  const filteredNotes = notes.filter(note => {
    const noteTags = note.tags?.toLowerCase().split(',') || [];
    return searchTags.every(tag => noteTags.includes(tag));
  });

  // Сортируем заметки
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (notesSortType === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }

    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA; // Новые сверху
  });


  const handleMoveNote = async () => {
    if (movingNote && selectedFolder) {
      await updateNote({
        ...movingNote,
        noteGroupUuid: selectedFolder
      });
      setMovingNote(null);
      setSelectedFolder('');
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchTags(prev => [...prev, tag.toLowerCase()]);
  };

  // Обработчик разворачивания тегов
  const handleExpandTags = (noteUuid: string) => {
    setExpandedNoteUuid(prev => prev === noteUuid ? null : noteUuid);
  };

  const handleDrawerActions = (note: INote, action: 'edit' | 'move' | 'delete') => {
    setOpenedDrawerId(null);
    switch(action) {
      case 'edit':
        onEdit(note);
        break;
      case 'move':
        setMovingNote(note);
        break;
      case 'delete':
        onDelete(note.uuid);
        break;
    }
  };

  const rows = [
    ...sortedNotes.map((note) => (
        <Table.Tr key={note.uuid}>
          <Table.Td>
            <Text
                style={{cursor: 'pointer'}}
                onClick={() => handleDrawerActions(note, 'edit')}
            >
              {note.title}
            </Text>
            {note.noteGroupUuid && showFolderName && (
                <Text size="xs" c="dimmed">
                  {allGroups.find((g) => g.uuid === note.noteGroupUuid)?.title || ''}
                </Text>
            )}
          </Table.Td>

          <Table.Td>
            <Group gap={4}>
              {(expandedNoteUuid === note.uuid
                      ? note.tags?.split(',')
                      : note.tags?.split(',').slice(0, 2)
              )?.map((tag, i) => (
                  <Badge
                      key={i}
                      variant="light"
                      style={{fontSize: "0.6rem", cursor: 'pointer'}}
                      onClick={() => handleTagClick(tag.trim())}
                  >
                    {tag.trim()}
                  </Badge>
              ))}
              {note.tags?.split(',').length > 2 && (
                  <Badge
                      variant="dot"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleExpandTags(note.uuid)}
                  >
                    {expandedNoteUuid === note.uuid
                        ? 'Свернуть'
                        : `+${note.tags.split(',').length - 2}`
                    }
                  </Badge>
              )}
            </Group>
          </Table.Td>

          <Table.Td>
            <Group gap={4} justify="flex-end">
              {isMobile ? (
                  <>
                    <ActionIcon
                        variant="subtle"
                        onClick={() => setOpenedDrawerId(note.uuid)}
                    >
                      <IconDots size={16} />
                    </ActionIcon>

                    <Drawer
                        opened={openedDrawerId === note.uuid}
                        onClose={() => setOpenedDrawerId(null)}
                        position="bottom"
                        title="Действия с заметкой"
                        size="25%"
                    >
                      <Stack gap="sm">
                        <Button
                            variant="subtle"
                            leftSection={<IconEdit size={16} />}
                            onClick={() => handleDrawerActions(note, 'edit')}
                        >
                          Редактировать
                        </Button>
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowRightCircleFilled size={16} />}
                            onClick={() => handleDrawerActions(note, 'move')}
                        >
                          Переместить
                        </Button>
                        <Button
                            color="red"
                            variant="subtle"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => handleDrawerActions(note, 'delete')}
                        >
                          Удалить
                        </Button>
                      </Stack>
                    </Drawer>
                  </>
              ) : (
                  <>
                    <ActionIcon
                        variant="subtle"
                        onClick={() => onEdit(note)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                        variant="subtle"
                        onClick={() => setMovingNote(note)}
                    >
                      <IconArrowRightCircleFilled size={16} />
                    </ActionIcon>
                    <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => onDelete(note.uuid)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </>
              )}
            </Group>
          </Table.Td>
        </Table.Tr>
    ))
  ];


  return (
      <>
        <Group justify="space-between" mb="md" wrap="nowrap" style={{ flexDirection: 'row' }}>
          <TagsInput
              placeholder="Поиск по тегам"
              value={searchTags}
              onChange={(tags) => setSearchTags(tags.map(t => t.toLowerCase()))}
              clearable
          />

          <SegmentedControl
              value={notesSortType}
              onChange={(value) => setNotesSortType(value as 'date' | 'title')}
              data={[
                {
                  value: 'date',
                  label: <IconCalendar size="1rem" />,
                  title: 'Сортировка по дате',
                },
                {
                  value: 'title',
                  label: <IconSortAZ size="1rem" />,
                  title: 'Сортировка по алфавиту',
                },
              ]}
              radius="sm"
              style={{ width: 200 }}
          />
        </Group>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th>Теги</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      <Modal
          opened={!!movingNote}
          fullScreen = {isMobile}
          transitionProps={{ transition: 'slide-up' }}
          onClose={() => setMovingNote(null)}
          title="Переместить заметку"
      >
        <NoteFolderSelector
            selectedUuid={selectedFolder}
            onSelect={setSelectedFolder}
            excludeUuid={selectedFolderUuid}
        />
        <Button
            fullWidth
            mt="md"
            onClick={handleMoveNote}
            disabled={!selectedFolder}
        >
          Переместить
        </Button>
      </Modal>
      </>
  );
};
