import { SimpleGrid, Card, Group, Text, ActionIcon, Modal, Button } from '@mantine/core';
import {IconFolder, IconNote, IconEdit, IconTrash, IconPlus, IconArrowRightCircleFilled} from '@tabler/icons-react';
import { INoteGroup } from '@/entities/BookEntities';
import { useState } from 'react';
import { NoteFolderSelector } from './NoteFolderSelector';

interface FolderListProps {
  groups: INoteGroup[];
  onEdit: (group: INoteGroup) => void;
  onDelete: (uuid: string) => void;
  onNavigate: (uuid: string) => void;
  onAdd: () => void;
  onMove: (group: INoteGroup, newParentUuid: string) => void;
  currentFolderUuid?: string;
}

export const FolderList = ({ groups, onEdit, onDelete, onNavigate, onAdd, onMove, currentFolderUuid }: FolderListProps) => {
  const [movingGroup, setMovingGroup] = useState<INoteGroup | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  const handleMoveGroup = async () => {
    if (movingGroup && selectedFolder) {
      onMove(movingGroup, selectedFolder);
      setMovingGroup(null);
      setSelectedFolder('');
    }
  };

  return (
      <>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {groups.map((group) => (
              <Card key={group.uuid} shadow="xs" padding="lg">
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
                        variant="subtle"
                        onClick={() => setMovingGroup(group)}
                    >
                      <IconArrowRightCircleFilled size={16} />
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

        <Modal
            opened={!!movingGroup}
            onClose={() => setMovingGroup(null)}
            title="Переместить папку"
        >
          <NoteFolderSelector
              selectedUuid={selectedFolder}
              onSelect={setSelectedFolder}
              includeTopLevel
              excludeUuid={currentFolderUuid || movingGroup?.uuid}
          />
          <Button
              fullWidth
              mt="md"
              onClick={handleMoveGroup}
              disabled={!selectedFolder}
          >
            Переместить
          </Button>
        </Modal>
      </>
  );
};
