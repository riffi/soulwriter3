import { Table, Group, Badge, ActionIcon, Text } from '@mantine/core';
import {IconEdit, IconTrash} from '@tabler/icons-react';
import { INote } from '@/entities/BookEntities';

interface NoteListProps {
  notes: INote[];
  onEdit: (note: INote) => void;
  onDelete: (uuid: string) => void;
  onAdd: () => void;
  onTagClick: (tag: string) => void;
}

export const NoteList = ({ notes, onEdit, onDelete, onAdd, onTagClick }: NoteListProps) => {
  const rows = [
    ...notes.map((note) => (
        <Table.Tr key={note.uuid}>
          <Table.Td>
            <Text>{note.title}</Text>
          </Table.Td>

          <Table.Td>
            <Group gap={4}>
              {note.tags?.split(',').map((tag, i) => (
                  <Badge
                      key={i}
                      variant="light"
                      style={{fontSize: "0.6rem", cursor: 'pointer'}}
                      onClick={() => onTagClick(tag.trim())}
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
  );
};
