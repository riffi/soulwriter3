// MainTabContent.tsx
import {Group, Select, Checkbox, Button, Drawer, TextInput, SimpleGrid, Title} from "@mantine/core";
import {
  IBlock,
  IBlockStructureKind,
  IBlockStructureKindTitle,
  IBlockTitleForms
} from "@/entities/ConstructorEntities";
import { IconViewer } from "@/components/shared/IconViewer/IconViewer";
import {GameIconSelector} from "@/components/shared/GameIconSelector/GameIconSelector";
import React, {useState, useEffect} from "react";
import {InlineEdit2} from "@/components/shared/InlineEdit2/InlineEdit2";

interface MainTabContentProps {
  block: IBlock;
  initialTitleForms?: IBlockTitleForms; // Pass initial forms from parent
  onBlockChange: (blockData: Partial<IBlock>) => void; // For general block property changes
  onTitleFormsChange: (titleForms: IBlockTitleForms) => void; // Specific for title forms
}

const structureKindOptions = [
  { value: IBlockStructureKind.single, label: IBlockStructureKindTitle.single },
  { value: IBlockStructureKind.multiple, label: IBlockStructureKindTitle.multiple },
  { value: IBlockStructureKind.tree, label: IBlockStructureKindTitle.tree },
];

export const MainTabContent = ({ block, initialTitleForms, onBlockChange, onTitleFormsChange }: MainTabContentProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

// Local state for title forms, initialized by prop
  const [currentTitleForms, setCurrentTitleForms] = useState<IBlockTitleForms>(
      initialTitleForms || block.titleForms || {
        nominative: block.title, // Default nominative to block title if forms are empty
        genitive: '', dative: '', accusative: '',
        instrumental: '', prepositional: '', plural: ''
      }
  );

  useEffect(() => {
    // If initialTitleForms from parent changes (e.g. after a save and re-fetch), update local state
    const newInitial = initialTitleForms || block.titleForms || {
      nominative: block.title, genitive: '', dative: '', accusative: '',
      instrumental: '', prepositional: '', plural: ''
    };
    setCurrentTitleForms(newInitial);
  }, [initialTitleForms, block.titleForms, block.title]);

  const handleTitleFormChange = (field: keyof IBlockTitleForms, value: string) => {
    const updatedForms = {
      ...currentTitleForms,
      [field]: value,
    };
    setCurrentTitleForms(updatedForms);
    onTitleFormsChange(updatedForms); // Notify parent (BlockEditForm)
  };

  // Helper to call onBlockChange for general block properties
  const handleBlockPropertyChange = (changedProps: Partial<IBlock>) => {
    onBlockChange(changedProps);
  };

  return (
      <>
        <Group align="flex-end" spacing="xl" mb="md">
          <Group w={"100%"}>
            <InlineEdit2
                onChange={(value) => handleBlockPropertyChange({ title: value })}
                value={block?.title}
                placeholder="введите название..."
                label={"Название блока"}
            />
          </Group>
          <Group w={"100%"}>
            <InlineEdit2
                onChange={(value) => handleBlockPropertyChange({ description: value })}
                value={block?.description}
                placeholder="введите описание..."
                label={"Описание"}
            />
          </Group>
          <Group>
            <Select
                value={block?.structureKind || IBlockStructureKind.single}
                onChange={(value) => handleBlockPropertyChange({ structureKind: value })}
                data={structureKindOptions}
                label="Тип структуры"
                size="sm"
                placeholder="Выберите тип структуры"
            />
          </Group>
        </Group>

        <Checkbox
            checked={block?.useTabs === 1}
            label="Использовать вкладки для группировки параметров"
            onChange={(e) => handleBlockPropertyChange({ useTabs: e.currentTarget.checked ? 1 : 0 })}
            mt="md"
            mb="xl"
        />

        <Checkbox
            checked={block?.sceneLinkAllowed === 1}
            label="Привязка к сцене"
            onChange={(e) => handleBlockPropertyChange({ sceneLinkAllowed: e.currentTarget.checked ? 1 : 0 })}
            mt="md"
            mb="xl"
        />

        <Checkbox
            checked={block?.showInSceneList === 1}
            label="Отображать в списке сцен"
            onChange={(e) => handleBlockPropertyChange({ showInSceneList: e.currentTarget.checked ? 1 : 0 })}
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
                handleBlockPropertyChange({ icon: iconName });
                setDrawerOpen(false);
              }}
          />
        </Drawer>
        <Title order={4} mt="xl" mb="sm">Формы названия</Title>
        <SimpleGrid cols={2} spacing="md">
          <TextInput
              label="Именительный (кто? что?)"
              value={currentTitleForms.nominative} // No ?? block.title here, currentTitleForms is initialized with it
              onChange={(e) => handleTitleFormChange('nominative', e.currentTarget.value)}
              placeholder="Именительный падеж"
          />
          <TextInput
              label="Родительный (кого? чего?)"
              value={currentTitleForms.genitive}
              onChange={(e) => handleTitleFormChange('genitive', e.currentTarget.value)}
              placeholder="Родительный падеж"
          />
          <TextInput
              label="Дательный (кому? чему?)"
              value={currentTitleForms.dative}
              onChange={(e) => handleTitleFormChange('dative', e.currentTarget.value)}
              placeholder="Дательный падеж"
          />
          <TextInput
              label="Винительный (кого? что?)"
              value={currentTitleForms.accusative}
              onChange={(e) => handleTitleFormChange('accusative', e.currentTarget.value)}
              placeholder="Винительный падеж"
          />
          <TextInput
              label="Творительный (кем? чем?)"
              value={currentTitleForms.instrumental}
              onChange={(e) => handleTitleFormChange('instrumental', e.currentTarget.value)}
              placeholder="Творительный падеж"
          />
          <TextInput
              label="Предложный (о ком? о чём?)"
              value={currentTitleForms.prepositional}
              onChange={(e) => handleTitleFormChange('prepositional', e.currentTarget.value)}
              placeholder="Предложный падеж"
          />
          <TextInput
              label="Множественное число (Именительный)"
              value={currentTitleForms.plural}
              onChange={(e) => handleTitleFormChange('plural', e.currentTarget.value)}
              placeholder="Множественное число"
              mt="sm" // Add some margin for the last item if it's alone in a row or to space it
          />
        </SimpleGrid>
      </>
  );
};
