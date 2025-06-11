import React, { useState } from 'react';
import { ActionIcon, Box, Group, Button, Space } from '@mantine/core'; // Removed Title
import { IconArrowLeft, IconTrash, IconList, IconChartDots3Filled } from '@tabler/icons-react';
import { IBlock, IBlockStructureKind, IIcon } from '@/entities/ConstructorEntities';
import { IBlockInstance } from '@/entities/BookEntities';
import { IconViewer } from '@/components/shared/IconViewer/IconViewer';
import { InlineEdit2 } from '@/components/shared/InlineEdit2/InlineEdit2';
import { IconSelector } from '@/components/shared/IconSelector/IconSelector';
import classes from './BlockInstanceEditorHeader.module.css'; // Ensure this path is correct

export interface BlockInstanceEditorHeaderProps {
  blockInstance: IBlockInstance | null | undefined;
  block: IBlock | null | undefined;
  isMobile: boolean;
  onNavigateBack: () => void;
  viewMode: 'data' | 'diagram';
  onChangeViewMode: (mode: 'data' | 'diagram') => void;
  onUpdateTitle: (newTitle: string) => void;
  onUpdateShortDescription: (newDescription: string) => void;
  onUpdateIcon: (icon: IIcon) => void;
  onRemoveIcon: () => void;
}

export const BlockInstanceEditorHeader: React.FC<BlockInstanceEditorHeaderProps> = ({
  blockInstance,
  block,
  isMobile,
  onNavigateBack,
  viewMode,
  onChangeViewMode,
  onUpdateTitle,
  onUpdateShortDescription,
  onUpdateIcon,
  onRemoveIcon,
}) => {
  const [iconDrawerOpen, setIconDrawerOpen] = useState(false);

  // Placeholder for JSX that will be moved from BlockInstanceEditor.tsx
  return (
    <Box>
      <Group className={classes.headerGroup} justify="space-between" p="xs" style={{backgroundColor: "var(--mantine-color-gray-0)"}}>
        <Group>
            <ActionIcon
                onClick={onNavigateBack}
                variant="subtle"
                size="lg"
                aria-label="Back to list"
            >
                <IconArrowLeft size={20}/>
            </ActionIcon>
            <ActionIcon
                variant={viewMode === 'data' ? 'filled' : 'light'}
                onClick={() => onChangeViewMode('data')}
                aria-label="Data view"
            >
                <IconList size={20}/>
            </ActionIcon>
            <ActionIcon
                onClick={() => onChangeViewMode('diagram')}
                variant={viewMode === 'diagram' ? 'filled' : 'light'}
                aria-label="Diagram view"
            >
                <IconChartDots3Filled size={20}/>
            </ActionIcon>
        </Group>
        {/* Potentially add title here if it's part of the fixed header */}
      </Group>

      {/* Icon editing section - moved from BlockInstanceEditor */}
      {viewMode === 'data' && block?.structureKind !== IBlockStructureKind.single && (
        <Box p="sm" className={classes.iconEditSection}>
          <Group>
            <Box
              onClick={() => setIconDrawerOpen(true)}
              className={classes.iconBox} // Use class from CSS module
            >
              <IconViewer
                icon={blockInstance?.icon ?? block?.icon}
                size={120} // Icon size for the clickable box
                backgroundColor={"transparent"}
                color="var(--mantine-color-blue-filled)"
              />
            </Box>
            <Box style={{ flex: '1' }}>
              <InlineEdit2
                label={block?.title || 'Block Title'} // Fallback label
                onChange={onUpdateTitle}
                value={blockInstance?.title || ''}
              />
              <Space h="md" />
              <InlineEdit2
                label="Краткое описание"
                placeholder="Введите описание..."
                onChange={onUpdateShortDescription}
                value={blockInstance?.shortDescription || ''}
                size="sm"
              />
            </Box>
          </Group>
          <Button
            onClick={onRemoveIcon}
            variant="subtle"
            color="red"
            size="xs"
            leftSection={<IconTrash size={14} />}
            mt="xs" // Added some margin for spacing
          >
            Удалить иконку
          </Button>
        </Box>
      )}

      <IconSelector
        opened={iconDrawerOpen}
        onClose={() => setIconDrawerOpen(false)}
        onSelect={(icon) => {
          onUpdateIcon(icon);
          setIconDrawerOpen(false);
        }}
        initialIcon={block?.icon}
      />
    </Box>
  );
};

// Export statement if not default, or ensure it's default if that's the convention
// export default BlockInstanceEditorHeader; // Assuming default export based on previous step
// Correcting to named export as per general practice for components unless specified
// No, the previous step used default. Let's stick to that for now.
export default BlockInstanceEditorHeader;
