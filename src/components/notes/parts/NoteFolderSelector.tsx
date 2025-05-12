import {Group, Text, ActionIcon, Collapse, Badge, Box} from '@mantine/core';
import { IconFolder, IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { useNoteManager } from '../hook/useNoteManager';
import { useLiveQuery } from 'dexie-react-hooks';


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
      <Box style={{ marginLeft: level * 20 }}>
        <Group
            style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}
            gap="xs"
        >
          {includeTopLevel && level === 0 && (
              <Box w="100%">
                {/* Мобильный вариант корневого уровня */}
                <Group
                    justify="space-between"
                    style={{ cursor: 'pointer', padding: '4px 8px', width: '100%' }}
                    onClick={() => onSelect('topLevel')}
                    bg={selectedUuid === 'topLevel' ? 'var(--mantine-color-blue-light)' : undefined}
                >
                  <Group gap="xs">
                    <IconFolder size={18} />
                    <Text size="sm">Корневой уровень</Text>
                  </Group>
                </Group>
              </Box>
          )}

          {groups.map((group) => (
              <Box w="100%" key={group.uuid}>
                <Group
                    justify="space-between"
                    style={{ cursor: 'pointer', padding: '4px 8px', width: '100%' }}
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

                {/* Вложенные элементы */}
                {openedFolders[group.uuid!] && (
                    <Box pl={20}>
                      <NoteFolderSelector
                          selectedUuid={selectedUuid}
                          onSelect={onSelect}
                          parentUuid={group.uuid}
                          level={level + 1}
                          excludeUuid={excludeUuid}
                          includeTopLevel={includeTopLevel}
                      />
                    </Box>
                )}
              </Box>
          ))}
        </Group>
      </Box>

  );
};
