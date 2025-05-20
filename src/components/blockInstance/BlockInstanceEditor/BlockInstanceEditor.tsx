import {useNavigate} from "react-router-dom";
import {
  useBlockInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/hooks/useBlockInstanceEditor";
import {
  ActionIcon,
  Box,
  Container,
  Group,
  SegmentedControl,
} from "@mantine/core";
import {IconArrowLeft} from "@tabler/icons-react";
import classes from "./BlockInstanceEditor.module.css";
import React, {useEffect, useState} from "react";

import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {
  InstanceRelationsEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceRelationsEditor/InstanceRelationsEditor";

import {
  ChildInstancesTable
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceChildrenEditor/ChildInstancesTable";

import {
  InstanceParameterEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/InstanceParameterEditor";
import {relationUtils} from "@/utils/relationUtils";

export interface IBlockInstanceEditorProps {
  blockInstanceUuid: string;
}



export const BlockInstanceEditor = (props: IBlockInstanceEditorProps) => {


  // Состояния для вкладок и активной вкладки
  const [tabs, setTabs] = useState<Array<{ label: string; value: string }>>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const {
    blockInstance,
    block,
    updateBlockInstanceTitle,
    relatedBlocks,
    blockRelations,
    childBlocks,
    childInstancesMap,
    blockTabs
  } = useBlockInstanceEditor(props.blockInstanceUuid);

  const navigate = useNavigate();


  const getTabs = () => {
    if (!blockTabs) return [{ label: 'Параметры', value: 'params' }];

    return blockTabs.map(tab => {
      switch (tab.tabKind) {
        case 'relation':
          return {
            label: tab.title,
            value: `related-${tab.relationUuid}`,
          };
        case 'childBlock':
          return {
            label: tab.title,
            value: `child-${tab.childBlockUuid}`,
          };
        default: // parameters
          return {
            label: tab.title,
            value: 'params',
          };
      }
    });
  };

  // Обновляем список вкладок и активную вкладку при изменении blockTabs
  useEffect(() => {
    const newTabs = getTabs();
    setTabs(newTabs);

    // Устанавливаем первую вкладку как активную
    if (newTabs.length > 0) {
      setActiveTab(newTabs[0].value);
    }
  }, [blockTabs]); // Зависимость от blockTabs



  const getRelatedBlockByRelationUuid = (relationUuid: string) => {
    return relationUtils.getRelatedBlockByRelationUuid(blockRelations, relatedBlocks, relationUuid);
  }


  return (
      <>
      <Container size="xl" p={'xs'} style={{backgroundColor: '#FFF', minHeight: 'calc(100vh - 100px)'}} >
        <Box className={classes.container} pos="relative">
          <Group mb="md" className={classes.header}>
            <ActionIcon
                onClick={() => navigate(-1)}
                variant="light"
                size="lg"
                aria-label="Back to list"
            >
              <IconArrowLeft size={20}/>
            </ActionIcon>
            <InlineEdit
                value={blockInstance?.title || ''}
                placeholder="Instance title"
                size="md"
                className={classes.titleInput}
                onChange={(val) => updateBlockInstanceTitle(val)}
            />
          </Group>
          <section>
            <SegmentedControl
                value={activeTab || ''}
                onChange={setActiveTab}
                data={tabs}
                style={{textTransform: 'Capitalize', display: tabs.length <= 1 ? 'none' : ''}}
                mb="md"
            />
            {blockTabs?.map(tab => {
              const tabValue = tab.tabKind === 'relation'
                  ? `related-${tab.relationUuid}`
                  : tab.tabKind === 'childBlock'
                      ? `child-${tab.childBlockUuid}`
                      : 'params';

              return (
                  activeTab === tabValue && (
                      <Box key={tab.uuid}>
                      <>
                        {tab.tabKind === 'parameters' &&
                            <>
                              <InstanceParameterEditor
                                  blockInstanceUuid={props.blockInstanceUuid}
                                  blockUseTabs={block?.useTabs === 1}
                                  relatedBlocks={relatedBlocks}
                                  relations={blockRelations}
                              />
                          </>
                        }
                      </>
                      <>
                        {tab.tabKind === 'relation' && (() => {
                          const relatedBlock = getRelatedBlockByRelationUuid(tab.relationUuid);
                          return relatedBlock && (
                              <InstanceRelationsEditor
                                  key={tab.uuid}
                                  blockInstanceUuid={props.blockInstanceUuid}
                                  blockUuid={block?.uuid}
                                  relatedBlock={relatedBlock}
                                  blockRelation={blockRelations?.find(r => r.uuid === tab.relationUuid)}
                              />
                          );
                        })()}
                      </>
                      <>
                        {tab.tabKind === 'childBlock' && (
                            childBlocks?.map(childBlock => (
                                activeTab === `child-${childBlock.uuid}` && (
                                    <ChildInstancesTable
                                        key={childBlock.uuid}
                                        blockUuid={childBlock.uuid}
                                        blockInstanceUuid={props.blockInstanceUuid}
                                        instances={childInstancesMap?.[childBlock.uuid] || []}
                                        structureKind={childBlock.structureKind}
                                        relatedBlock={childBlock}
                                    />
                                )
                            ))
                        )}
                      </>
                  </Box>
                  ))
            })}
        </section>
      </Box>
      </Container>
      </>
  );
};
