// MainTabContent.tsx
import {Group, Select, Checkbox, Button, Drawer, SimpleGrid, Title} from "@mantine/core";
import {
  IBlock,
  IBlockStructureKind,
  IBlockStructureKindTitle,
  IBlockTitleForms
} from "@/entities/ConstructorEntities";
import { IconViewer } from "@/components/shared/IconViewer/IconViewer";
import {GameIconSelector} from "@/components/shared/GameIconSelector/GameIconSelector";
import React, {useState} from "react";
import {InlineEdit2} from "@/components/shared/InlineEdit2/InlineEdit2";
import {InkLuminApi, InkLuminApiError} from "@/api/inkLuminApi";
import {notifications} from "@mantine/notifications";
import {LoadingOverlayExtended} from "@/components/shared/overlay/LoadingOverlayExtended";

interface MainTabContentProps {
  block: IBlock;
  onSave: (blockData: IBlock, titleForms?: IBlockTitleForms) => Promise<void>;
}

const structureKindOptions = [
  { value: IBlockStructureKind.single, label: IBlockStructureKindTitle.single },
  { value: IBlockStructureKind.multiple, label: IBlockStructureKindTitle.multiple },
  { value: IBlockStructureKind.tree, label: IBlockStructureKindTitle.tree },
];

export const MainTabContent = ({ block, onSave }: MainTabContentProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [titleFormsLoading, setTitleFormsLoading] = useState(false);

  const handleBlockPropertyChange = async (changedProps: Partial<IBlock>) => {
    const updatedBlock = { ...block, ...changedProps };
    await onSave(updatedBlock);
  };

  const handleTitleChange = async (newTitle: string) => {
    const updatedBlock = { ...block, title: newTitle };
    setTitleFormsLoading(true);
    try {
      // Попытаемся получить формы названия от InkLuminApi
      const titleForms = await InkLuminApi.fetchAndPrepareTitleForms(newTitle);
      await onSave(updatedBlock, titleForms);
    } catch (error) {
      if (error instanceof InkLuminApiError) {
        // Если API недоступен, просто сохраняем блок без обновления форм
        notifications.show({
          title: "Предупреждение",
          message: `Не удалось получить формы названия: ${error.message}`,
          color: "yellow",
        });
        await onSave(updatedBlock);
      } else {
        notifications.show({
          title: "Ошибка",
          message: "Не удалось сохранить изменения",
          color: "red",
        });
      }
    }
    finally {
      setTitleFormsLoading(false);
    }
  };

  const handleTitleFormChange = async (field: keyof IBlockTitleForms, value: string) => {
    const currentTitleForms = block.titleForms || {
      nominative: block.title || '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: '',
      plural: ''
    };

    const updatedTitleForms = {
      ...currentTitleForms,
      [field]: value,
    };

    await onSave(block, updatedTitleForms);
  };

  const currentTitleForms = block.titleForms || {
    nominative: block.title || '',
    genitive: '',
    dative: '',
    accusative: '',
    instrumental: '',
    prepositional: '',
    plural: ''
  };

  return (
      <>
        <LoadingOverlayExtended visible={titleFormsLoading} message="Загрузка форм названия..."/>
        <Group align="flex-end" spacing="xl" mb="md">
          <Group w={"100%"}>
            <InlineEdit2
                onChange={handleTitleChange}
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
          <InlineEdit2
              label="Именительный (кто? что?)"
              value={currentTitleForms.nominative}
              onChange={(value) => handleTitleFormChange('nominative', value)}
              placeholder="Именительный падеж"
          />
          <InlineEdit2
              label="Родительный (кого? чего?)"
              value={currentTitleForms.genitive}
              onChange={(value) => handleTitleFormChange('genitive', value)}
              placeholder="Родительный падеж"
          />
          <InlineEdit2
              label="Дательный (кому? чему?)"
              value={currentTitleForms.dative}
              onChange={(value) => handleTitleFormChange('dative', value)}
              placeholder="Дательный падеж"
          />
          <InlineEdit2
              label="Винительный (кого? что?)"
              value={currentTitleForms.accusative}
              onChange={(value) => handleTitleFormChange('accusative', value)}
              placeholder="Винительный падеж"
          />
          <InlineEdit2
              label="Творительный (кем? чем?)"
              value={currentTitleForms.instrumental}
              onChange={(value) => handleTitleFormChange('instrumental', value)}
              placeholder="Творительный падеж"
          />
          <InlineEdit2
              label="Предложный (о ком? о чём?)"
              value={currentTitleForms.prepositional}
              onChange={(value) => handleTitleFormChange('prepositional', value)}
              placeholder="Предложный падеж"
          />
          <InlineEdit2
              label="Множественное число (Именительный)"
              value={currentTitleForms.plural}
              onChange={(value) => handleTitleFormChange('plural', value)}
              placeholder="Множественное число"
              style={{ gridColumn: '1 / -1' }}
          />
        </SimpleGrid>
      </>
  );
};
