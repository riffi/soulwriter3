import { SimpleGrid, Card, Group, Text, ActionIcon } from '@mantine/core';
import { IconFolder, IconNote, IconEdit, IconTrash } from '@tabler/icons-react';
import { INoteGroup } from '@/entities/BookEntities';

interface FolderListProps {
  groups: INoteGroup[];
  onEdit: (group: INoteGroup) => void;
  onDelete: (uuid: string) => void;
  onNavigate: (uuid: string) => void;
}

export const FolderList = ({ groups, onEdit, onDelete, onNavigate }: FolderListProps) => (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {groups.map((group) => (
          <Card key={group.uuid} shadow="sm" padding="lg">
            <Group justify="space-between">
              <Group
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate(group.uuid)}
              >
                <IconFolder size={24} />
                <Text fw={500}>{group.title}</Text>
              </Group>
              <Group gap={4}>
                <ActionIcon
                    variant="subtle"
                    onClick={() => onEdit(group)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => onDelete(group.uuid)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
      ))}
    </SimpleGrid>
);
