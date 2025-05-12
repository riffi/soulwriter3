import {
  Table,
  Group,
  Badge,
  ActionIcon,
  Text,
  Modal,
  Button,
  Select,
  TagsInput, SegmentedControl
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconArrowRightCircleFilled,
  IconCalendar,
  IconSortAZ
} from '@tabler/icons-react';
import { INote } from '@/entities/BookEntities';
import {useState} from "react";
import {useNoteManager} from "@/components/notes/hook/useNoteManager";
import {NoteFolderSelector} from "@/components/notes/parts/NoteFolderSelector";
import {useLiveQuery} from "dexie-react-hooks";
import {configDatabase} from "@/entities/configuratorDb";

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
  const [sortType, setSortType] = useState<'date' | 'title'>('date');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const { updateNote} = useNoteManager();

  // Получаем все группы заметок
  const allGroups = useLiveQuery(() => configDatabase.notesGroups.toArray(), [notes]) || [];


  const filteredNotes = notes.filter(note => {
    const noteTags = note.tags?.toLowerCase().split(',') || [];
    return searchTags.every(tag => noteTags.includes(tag));
  });

  // Сортируем заметки
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortType === 'title') {
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

  const rows = [
    ...sortedNotes.map((note) => (
        <Table.Tr key={note.uuid}>
          <Table.Td>
            <Text>{note.title}</Text>
            {note.noteGroupUuid && showFolderName && (
                <Text size="xs" c="dimmed">
                  {allGroups.find((g) => g.uuid === note.noteGroupUuid)?.title || ''}
                </Text>
            )}
          </Table.Td>

          <Table.Td>
            <Group gap={4}>
              {note.tags?.split(',').map((tag, i) => (
                  <Badge
                      key={i}
                      variant="light"
                      style={{fontSize: "0.6rem", cursor: 'pointer'}}
                      onClick={() => handleTagClick(tag.trim())}
                  >
                    {tag}
                  </Badge>
              ))}
            </Group>
          </Table.Td>

          <Table.Td>
            <Group gap={4} justify="flex-end">
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
            </Group>
          </Table.Td>
        </Table.Tr>
    ))
  ];


  return (
      <>
        <Group justify="space-between" mb="md">
          <TagsInput
              placeholder="Поиск по тегам"
              value={searchTags}
              onChange={(tags) => setSearchTags(tags.map(t => t.toLowerCase()))}
              style={{ width: 300 }}
              clearable
          />

          <SegmentedControl
              value={sortType}
              onChange={(value) => setSortType(value as 'date' | 'title')}
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
