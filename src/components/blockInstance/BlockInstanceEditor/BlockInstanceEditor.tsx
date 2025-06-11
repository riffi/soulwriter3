import {useNavigate} from "react-router-dom";
// Removed useBlockInstanceEditor
import {
  Box,        // Used for conditional rendering wrapper
  Container,  // Outermost wrapper
  Group,      // For page title header
  Title       // For page title header
  // Removed: ActionIcon, ScrollArea, SegmentedControl, Text, Button, Drawer, Modal, Stack, Space
} from "@mantine/core";
// import {IconArrowLeft, IconTrash, IconList, IconChartDots3Filled} from "@tabler/icons-react"; // Moved to Header
import classes from "./BlockInstanceEditor.module.css";
import React, {useEffect} from "react"; // Removed useState, useCallback as they are no longer used

// Import new hooks

// Import new hooks
import { useBlockInstanceData } from "./hooks/useBlockInstanceData";
import { useBlockInstanceMutations, IIcon } from "./hooks/useBlockInstanceMutations"; // Added IIcon here
import { useBlockRelations } from "./hooks/useBlockRelations";
import { useBlockChildren } from "./hooks/useBlockChildren";
import { useReferencingParameters } from "./hooks/useReferencingParameters";

// import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit"; // Unused
// Imports for components now rendered by BlockInstanceDataView are removed from here
// import { InstanceRelationsEditor } from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceRelationsEditor/InstanceRelationsEditor";
// import { ChildInstancesTable } from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceChildrenEditor/ChildInstancesTable";
// import { InstanceParameterEditor } from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/InstanceParameterEditor";
// import {relationUtils} from "@/utils/relationUtils"; // Moved to DataView
import {IconViewer} from "@/components/shared/IconViewer/IconViewer"; // Used for page title
import {IBlock } from "@/entities/ConstructorEntities"; // IBlockStructureKind, IBlockTabKind removed
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
// import { ReferencedInstanceEditor } from "@/components/blockInstance/BlockInstanceEditor/parts/ReferencedInstanceEditor/ReferencedInstanceEditor";
// import {InlineEdit2} from "@/components/shared/InlineEdit2/InlineEdit2"; // Moved to Header

import {notifications} from "@mantine/notifications";

// import {IconSelector} from "@/components/shared/IconSelector/IconSelector"; // Moved to Header
import {InstanceMindMap} from "@/components/mindMap/InstanceMindMap/InstanceMindMap";
import { useUiSettingsStore } from "@/stores/uiSettingsStore/uiSettingsStore";
// InstanceScenesEditor will be rendered by BlockInstanceDataView
// import { InstanceScenesEditor } from './parts/InstanceScenesEditor/InstanceScenesEditor';
import BlockInstanceEditorHeader from "./parts/BlockInstanceEditorHeader"; // Import the new header
import BlockInstanceDataView from "./parts/BlockInstanceDataView"; // Import the new data view

export interface IBlockInstanceEditorProps {
  blockInstanceUuid: string;
}

export const BlockInstanceEditor = (props: IBlockInstanceEditorProps) => {
  // Tab state and related functions moved to BlockInstanceDataView
  const navigate = useNavigate();
  const {isMobile} = useMedia();
  const {
    blockInstanceViewMode,
    setBlockInstanceViewMode
  } = useUiSettingsStore();

  const {setTitleElement} = usePageTitle()

  // Call new hooks
  const { blockInstance, block, blockTabs } = useBlockInstanceData(props.blockInstanceUuid);
  const { updateBlockInstanceTitle, updateBlockInstanceShortDescription, updateBlockInstanceIcon } = useBlockInstanceMutations(props.blockInstanceUuid);
  const { relatedBlocks, allBlocks, blockRelations } = useBlockRelations(block?.uuid);
  const { childBlocks, childInstancesMap } = useBlockChildren(block?.uuid, props.blockInstanceUuid);
  const { referencingParams } = useReferencingParameters(block?.uuid);

  const header =( <Group>
    <IconViewer
        icon={blockInstance?.icon ?? block?.icon}
        size={isMobile? 20 : 28}
        style={{
          color: 'white',
          boxShadow: '0px 0px 5px rgba(0,0,0,0.2)',
          backgroundColor: "var(--mantine-color-blue-5)"
        }}
    />
    <Title
        order={isMobile? 4 : 2}
        style={{
          textTransform: "capitalize",
          color: "var(--mantine-color-blue-5)"
        }}
    >
      {blockInstance?.title || ''}
    </Title>
  </Group>)

  useEffect(() =>{
    if (block) {
      setTitleElement(header);
    }
  }, [block, blockInstance])

  // getTabs, activeTab, setActiveTab, and related useEffect are moved to BlockInstanceDataView

  // getRelatedBlockByRelationUuid is now used inside BlockInstanceDataView.
  // If it were needed here for other purposes, it would stay.

  // Handlers for BlockInstanceEditorHeader
  const handleUpdateTitleAndNotify = async (newTitle: string) => {
    await updateBlockInstanceTitle(newTitle);
    notifications.show({ title: "Успешно", message: "Название обновлено" });
  };

  const handleUpdateShortDescriptionAndNotify = async (newDescription: string) => {
    await updateBlockInstanceShortDescription(newDescription);
    notifications.show({ title: "Успешно", message: "Описание обновлено" });
  };

  const handleUpdateIconAndNotify = async (newIcon: IIcon) => {
    await updateBlockInstanceIcon(newIcon);
    notifications.show({ title: "Успешно", message: "Иконка обновлена" });
  };

  const handleRemoveIconAndNotify = async () => {
    await updateBlockInstanceIcon(undefined); // Assuming undefined removes it
    notifications.show({ title: "Успешно", message: "Иконка удалена" });
  };


  return (
      <>
        <Container size="lg" p={'xs'} style={{backgroundColor: '#FFF', minHeight: 'calc(100vh - 100px)'}} >
          <Box className={classes.container} pos="relative">
            {/* Use the new header component */}
            <BlockInstanceEditorHeader
              blockInstance={blockInstance}
              block={block}
              isMobile={isMobile}
              onNavigateBack={() => navigate(-1)}
              viewMode={blockInstanceViewMode}
              onChangeViewMode={setBlockInstanceViewMode}
              onUpdateTitle={handleUpdateTitleAndNotify}
              onUpdateShortDescription={handleUpdateShortDescriptionAndNotify}
              onUpdateIcon={handleUpdateIconAndNotify}
              onRemoveIcon={handleRemoveIconAndNotify}
            />

            {blockInstanceViewMode  === 'diagram' &&<InstanceMindMap blockInstance={blockInstance} />}
            {blockInstanceViewMode  === 'data' &&
              <BlockInstanceDataView
                blockInstanceUuid={props.blockInstanceUuid}
                block={block}
                blockInstance={blockInstance}
                blockTabs={blockTabs}
                relatedBlocks={relatedBlocks}
                allBlocks={allBlocks}
                blockRelations={blockRelations}
                childBlocks={childBlocks}
                childInstancesMap={childInstancesMap}
                referencingParams={referencingParams}
              />
            }
          </Box>
        </Container>

        {/* IconSelector has been moved to BlockInstanceEditorHeader */}
      </>
  );
};
