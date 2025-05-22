// BlockEditForm.tsx
import {
  Anchor,
  Breadcrumbs,
  Container,
  Space,
  Group, SegmentedControl, ScrollArea, Button, Modal, Text, Alert, Title, SimpleGrid, TextInput
} from "@mantine/core";
import { useBlockEditForm } from "@/components/configurator/BlockEditForm/useBlockEditForm";
import React, {useState, useEffect} from "react";
import { IBlock, IBlockTitleForms } from "@/entities/ConstructorEntities";
import { InkLuminApiError } from "@/api/inkLuminApi";
import classes from "./BlockEditForm.module.css";
import {RelationManager} from "@/components/configurator/BlockEditForm/parts/RelationManager/RelationManager";
import {ChildBlocksManager} from "@/components/configurator/BlockEditForm/parts/ChildBlocksManager/ChildBlocksManager";
import {
  BlockTabsManager
} from "@/components/configurator/BlockEditForm/parts/BlockTabsManager/BlockTabsManager";
import {
  MainTabContent
} from "@/components/configurator/BlockEditForm/parts/MainTabContent/MainTabContent";
import {
  ParamManager
} from "@/components/configurator/BlockEditForm/parts/ParamManager/ParamManager";
import {notifications} from "@mantine/notifications";

interface IBlockEditFormProps {
  blockUuid: string;
  bookUuid?: string;
}


export const BlockEditForm = ({ blockUuid, bookUuid }: IBlockEditFormProps) => {

  const [activeTab, setActiveTab] = useState<'main', 'parameters' | 'relations' | 'children'  | 'tabs'>('main');


  const {
    saveBlock: hookSaveBlock, // Renamed to avoid conflict with local state/functions if any
    configuration,
    block: initialBlock, // Renamed to clarify it's the initial load from hook
    otherBlocks,
    paramList,
    paramGroupList,
    blockRelations,
  } = useBlockEditForm(blockUuid, bookUuid);

  // State for the block data being edited
  const [currentBlockData, setCurrentBlockData] = useState<Partial<IBlock> | undefined>(initialBlock);
  // State for the title forms being edited
  const [currentTitleForms, setCurrentTitleForms] = useState<IBlockTitleForms | undefined>(initialBlock?.titleForms);

  // State for error dialog
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false); // Renamed for clarity
  const [errorDialogMessage, setErrorDialogMessage] = useState(''); // For specific error message from API
  const [dialogTitleForms, setDialogTitleForms] = useState<IBlockTitleForms>({
    nominative: '', genitive: '', dative: '', accusative: '',
    instrumental: '', prepositional: '', plural: ''
  });

  useEffect(() => {
    // Update local state when the block from the hook changes (e.g., initial load, or external update)
    if (initialBlock) {
      setCurrentBlockData(initialBlock);
      if (initialBlock.titleForms) {
        setCurrentTitleForms(initialBlock.titleForms);
        // Also initialize dialogTitleForms in case dialog is opened before any local changes
        setDialogTitleForms(initialBlock.titleForms);
      } else {
        const defaultForms = {
          nominative: initialBlock.title || '', genitive: '', dative: '', accusative: '',
          instrumental: '', prepositional: '', plural: ''
        };
        setCurrentTitleForms(defaultForms);
        setDialogTitleForms(defaultForms);
      }
    }
  }, [initialBlock]);

  const handleBlockDataChange = (updatedPartialBlock: Partial<IBlock>) => {
    setCurrentBlockData(prev => ({ ...prev, ...updatedPartialBlock }));
  };

  const handleTitleFormsChange = (updatedTitleForms: IBlockTitleForms) => {
    setCurrentTitleForms(updatedTitleForms);
  };

  const handleSave = async () => {
    if (!currentBlockData || !currentBlockData.uuid) {
      console.error("Cannot save, block data or UUID is missing.");
      // Optionally show a user notification
      return;
    }
    // Ensure all required fields for IBlock are present if currentBlockData is Partial<IBlock>
    // This might involve merging with initialBlock or ensuring currentBlockData becomes complete
    const blockToSave = { ...initialBlock, ...currentBlockData } as IBlock;


    try {
      await hookSaveBlock(blockToSave, currentTitleForms);
      // Success notification is handled by the hook in useBlockEditForm
    } catch (error) {
      if (error instanceof InkLuminApiError) {
        setErrorDialogMessage(error.message); // Keep the original API error message for display
        // Initialize dialog forms with current state or defaults
        setDialogTitleForms(currentTitleForms || {
          nominative: blockToSave.title || '', // Use current block's title
          genitive: '', dative: '', accusative: '',
          instrumental: '', prepositional: '', plural: ''
        });
        setShowApiErrorDialog(true);
        console.error("InkLuminApiError caught, showing manual input dialog:", error.message);
      } else {
        // Generic errors are already handled by the hook's notification, but log here too
        console.error("Generic error during save:", error);
      }
    }
  };

  const handleSaveFromDialog = async () => {
    if (!currentBlockData || !currentBlockData.uuid) {
      console.error("Cannot save from dialog, block data or UUID is missing.");
      // Optionally show a user notification within the dialog
      notifications.show({
        title: "Ошибка данных",
        message: "Основные данные блока отсутствуют.",
        color: "red",
      });
      return;
    }
    const blockToSave = { ...initialBlock, ...currentBlockData } as IBlock;

    try {
      await hookSaveBlock(blockToSave, dialogTitleForms); // Pass data from dialog
      setShowApiErrorDialog(false);
      notifications.show({ // Show success here as hook might not know context
        title: "Успешно",
        message: "Блок сохранен с ручным вводом форм названия.",
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка при принудительном сохранении",
        message: error instanceof Error ? error.message : "Не удалось сохранить данные из диалога.",
        color: "red",
      });
      console.error("Error saving from API error dialog:", error);
      // Optionally, keep the dialog open and display error message within it
    }
  };

  const handleDialogTitleFormChange = (field: keyof IBlockTitleForms, value: string) => {
    setDialogTitleForms(prev => ({
      ...(prev || { nominative: '', genitive: '', dative: '', accusative: '', instrumental: '', prepositional: '', plural: '' }),
      [field]: value,
    }));
  };

  const breadCrumbs = [
    { title: "Конфигуратор", href: "/configurator" },
    {
      title: configuration?.title,
      href: `/configuration/edit?uuid=${configuration?.uuid}`,
    },
    { title: currentBlockData?.title || initialBlock?.title, href: "#" },
  ].map((item, index) => (
      <Anchor href={item.href} key={index}>
        {item.title}
      </Anchor>
  ));

  if (!currentBlockData) {
    return <Container><Text>Загрузка данных блока...</Text></Container>;
  }

  return (
      <Container size="lg" py="md" className={classes.container}>
        {/* Consider adding an input for block.title here if it's not in MainTabContent */}
        <h1>Блок: {currentBlockData?.title || initialBlock?.title}</h1>
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          {breadCrumbs}
        </Breadcrumbs>

        <Space h="md" />
        {/* Add a general save button */}
        <Button onClick={handleSave} mb="md">Сохранить блок</Button>

        <Space h="md" />

        <Group mb="md" pos="relative" style={{ overflow: 'visible' }}>

          <ScrollArea
              type="hover"
              offsetScrollbars
              styles={{
                viewport: { scrollBehavior: 'smooth' },
                root: { flex: 1 }
              }}
          >
            <SegmentedControl
                value={activeTab}
                onChange={(value) => setActiveTab(value)}
                data={[
                  { value: 'main', label: 'Основное' },
                  { value: 'parameters', label: 'Параметры' },
                  { value: 'relations', label: 'Связи' },
                  { value: 'children', label: 'Дочерние' }, // Сократите длинные названия
                  { value: 'tabs', label: 'Вкладки' },
                ]}
                styles={{
                  root: {
                    minWidth: 380, // Минимальная ширина для десктопов
                  },
                }}
            />
          </ScrollArea>
        </Group>

        {activeTab === 'main' && currentBlockData && (
            <>
              <MainTabContent
                  block={currentBlockData as IBlock} // Cast because currentBlockData can be partial initially
                  initialTitleForms={currentTitleForms}
                  onBlockChange={handleBlockDataChange}
                  onTitleFormsChange={handleTitleFormsChange}
              />
            </>
        )}

        {activeTab === 'parameters' && currentBlockData && (
            <>
              <ParamManager
                  blockUuid={blockUuid}
                  bookUuid={bookUuid}
                  useTabs={currentBlockData?.useTabs}
                  paramList={paramList}
                  paramGroupList={paramGroupList}
                  otherBlocks={otherBlocks}
              />
            </>
        )}
        {activeTab === 'relations' && currentBlockData && (
            <>
              <RelationManager
                  otherBlocks={otherBlocks || []}
                  block={currentBlockData as IBlock}
                  bookUuid={bookUuid}
              />
            </>
        )}
        {activeTab === 'children' && currentBlockData && (
            <>
              <ChildBlocksManager
                  otherBlocks={otherBlocks || []}
                  blockUuid={blockUuid}
                  bookUuid={bookUuid}
              />

            </>
        )}

        {activeTab === 'tabs' && currentBlockData && (
            <BlockTabsManager
                otherRelations={blockRelations || []}
                currentBlockUuid={blockUuid}
                otherBlocks={otherBlocks}
                bookUuid={bookUuid}
            />
        )}
        <Modal
            opened={showApiErrorDialog}
            onClose={() => setShowApiErrorDialog(false)}
            title="Ошибка API InkLumin и ручной ввод форм"
            size="lg"
        >
          <Text c="dimmed" mb="sm">
            Сервис автоматического определения форм названия InkLumin недоступен (Ошибка: {errorDialogMessage}).
            Вы можете ввести формы названия вручную.
          </Text>

          <Title order={5} mt="md" mb="xs">Ручной ввод форм названия:</Title>
          <SimpleGrid cols={2} spacing="sm">
            <TextInput
                label="Именительный (кто? что?)"
                value={dialogTitleForms.nominative}
                onChange={(e) => handleDialogTitleFormChange('nominative', e.currentTarget.value)}
                placeholder="Именительный падеж"
            />
            <TextInput
                label="Родительный (кого? чего?)"
                value={dialogTitleForms.genitive}
                onChange={(e) => handleDialogTitleFormChange('genitive', e.currentTarget.value)}
                placeholder="Родительный падеж"
            />
            <TextInput
                label="Дательный (кому? чему?)"
                value={dialogTitleForms.dative}
                onChange={(e) => handleDialogTitleFormChange('dative', e.currentTarget.value)}
                placeholder="Дательный падеж"
            />
            <TextInput
                label="Винительный (кого? что?)"
                value={dialogTitleForms.accusative}
                onChange={(e) => handleDialogTitleFormChange('accusative', e.currentTarget.value)}
                placeholder="Винительный падеж"
            />
            <TextInput
                label="Творительный (кем? чем?)"
                value={dialogTitleForms.instrumental}
                onChange={(e) => handleDialogTitleFormChange('instrumental', e.currentTarget.value)}
                placeholder="Творительный падеж"
            />
            <TextInput
                label="Предложный (о ком? о чём?)"
                value={dialogTitleForms.prepositional}
                onChange={(e) => handleDialogTitleFormChange('prepositional', e.currentTarget.value)}
                placeholder="Предложный падеж"
            />
            <TextInput
                label="Множественное число (Им.)"
                value={dialogTitleForms.plural}
                onChange={(e) => handleDialogTitleFormChange('plural', e.currentTarget.value)}
                placeholder="Множественное число"
                // span full width if SimpleGrid has 2 cols:
                style={{ gridColumn: '1 / -1' }}
            />
          </SimpleGrid>

          <Group mt="lg" justify="flex-end">
            <Button variant="default" onClick={() => setShowApiErrorDialog(false)}>Отмена</Button>
            <Button onClick={handleSaveFromDialog} color="orange">Сохранить принудительно</Button>
          </Group>
        </Modal>
      </Container>
  );
};
