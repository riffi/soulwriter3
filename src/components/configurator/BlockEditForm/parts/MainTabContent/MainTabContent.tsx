// MainTabContent.tsx
import {Group, Select, Checkbox, Button, Drawer} from "@mantine/core";
import {
  IBlock,
  IBlockStructureKind,
  IBlockStructureKindTitle
} from "@/entities/ConstructorEntities";
import { IconViewer } from "@/components/shared/IconViewer/IconViewer";
import {GameIconSelector} from "@/components/shared/GameIconSelector/GameIconSelector";
import React, {useState} from "react";

interface MainTabContentProps {
  block: IBlock;
  saveBlock: (blockData: any) => void;
}

const structureKindOptions = [
  { value: IBlockStructureKind.single, label: IBlockStructureKindTitle.single },
  { value: IBlockStructureKind.multiple, label: IBlockStructureKindTitle.multiple },
  { value: IBlockStructureKind.tree, label: IBlockStructureKindTitle.tree },
];

export const MainTabContent = ({ block, saveBlock }: MainTabContentProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
      <>
        <Group align="flex-end" spacing="xl" mb="md">
          <Group>
            <Select
                value={block?.structureKind || IBlockStructureKind.single}
                onChange={(value) => saveBlock({ ...block, structureKind: value })}
                data={structureKindOptions}
                size="sm"
                placeholder="Выберите тип структуры"
            />
          </Group>
        </Group>

        <Checkbox
            checked={block?.useTabs === 1}
            label="Использовать вкладки для группировки параметров"
            onChange={(e) => saveBlock({ ...block, useTabs: e.currentTarget.checked ? 1 : 0 })}
            mt="md"
            mb="xl"
        />

        <Checkbox
            checked={block?.sceneLinkAllowed === 1}
            label="Привязка к сцене"
            onChange={(e) => saveBlock({ ...block, sceneLinkAllowed: e.currentTarget.checked ? 1 : 0 })}
            mt="md"
            mb="xl"
        />

        <Group gap="xs">
          <Button
              onClick={() => setDrawerOpen(true)}
              variant="outline"
              size="sm"
              leftSection={
                  block?.icon && (
                      <IconViewer
                          iconName={block.icon}
                          style={{ color: "var(--mantine-color-blue-filled)" }}
                      />
                  )
              }
          >
            {block?.icon ? 'Изменить иконку' : 'Выбрать иконку'}
          </Button>
        </Group>

        <Drawer
            opened={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Выберите иконку"
            position="right"
            size="md"
        >
          <GameIconSelector
              searchQuery={searchQuery}
              onSearchChange={(e) => setSearchQuery(e.currentTarget.value)}
              onSelectIcon={(iconName) => {
                saveBlock({ ...block, icon: iconName });
                setDrawerOpen(false);
              }}
          />
        </Drawer>
      </>
  );
};
