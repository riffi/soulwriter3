import { Group, Text, ActionIcon, Collapse, Badge } from '@mantine/core';
import { IconFolder, IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { useNoteManager } from '../hook/useNoteManager';
import { useLiveQuery } from 'dexie-react-hooks';
import { INoteGroup } from '@/entities/BookEntities';

interface NoteFolderSelectorProps {
  selectedUuid?: string;
  onSelect: (uuid: string) => void;
  parentUuid?: string;
  level?: number;
  excludeUuid?: string;
  includeTopLevel?: boolean; // Новый параметр
}


export const NoteFolderSelector = ({
                                     selectedUuid,
                                     onSelect,
                                     parentUuid = 'topLevel',
                                     level = 0,
                                     excludeUuid,
                                     includeTopLevel = false,
                                   }: NoteFolderSelectorProps) => {
  const { getChildGroups } = useNoteManager();
  const [openedFolders, setOpenedFolders] = useState<Record<string, boolean>>({});

  const groups = useLiveQuery(() => getChildGroups(parentUuid), [parentUuid]) || [];

  const handleToggle = (uuid: string) => {
    setOpenedFolders(prev => ({ ...prev, [uuid]: !prev[uuid] }));
  };

  return (
      <Group gap={0} style={{ marginLeft: level * 20 }} wrap="nowrap" align="flex-start">
        {includeTopLevel && level === 0 && (
            <div key="topLevel" style={{ width: '100%' }}>
              <Group
                  justify="space-between"
                  style={{ cursor: 'pointer', padding: '4px 8px' }}
                  onClick={() => onSelect('topLevel')}
                  bg={selectedUuid === 'topLevel' ? 'var(--mantine-color-blue-light)' : undefined}
              >
                <Group gap="xs">
                  <IconFolder size={18} />
                  <Text size="sm">Корневой уровень</Text>
                </Group>
              </Group>
            </div>
        )}

        {groups
        .filter(group => group.uuid !== excludeUuid)
        .map((group) => (
            <div key={group.uuid} style={{ width: '100%' }}>
              <Group
                  justify="space-between"
                  style={{ cursor: 'pointer', padding: '4px 8px' }}
                  onClick={() => onSelect(group.uuid!)}
                  bg={selectedUuid === group.uuid ? 'var(--mantine-color-blue-light)' : undefined}
              >
                <Group gap="xs">
                  <ActionIcon
                      variant="transparent"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(group.uuid!);
                      }}
                  >
                    {openedFolders[group.uuid!] ? (
                        <IconChevronDown size={16} />
                    ) : (
                        <IconChevronRight size={16} />
                    )}
                  </ActionIcon>
                  <IconFolder size={18} />
                  <Text size="sm">{group.title}</Text>
                </Group>
              </Group>

              {openedFolders[group.uuid!] && (
                  <NoteFolderSelector
                      selectedUuid={selectedUuid}
                      onSelect={onSelect}
                      parentUuid={group.uuid}
                      level={level + 1}
                      excludeUuid={excludeUuid}
                  />
              )}
            </div>
        ))}
      </Group>
  );
};
