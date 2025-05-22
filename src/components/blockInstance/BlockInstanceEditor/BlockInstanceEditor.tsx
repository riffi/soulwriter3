import {useNavigate} from "react-router-dom";
import {
  useBlockInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/hooks/useBlockInstanceEditor";
import {
  ActionIcon,
  Box,
  Container,
  Group, ScrollArea,
  SegmentedControl,
  Text, Title
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
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";
import {IBlockStructureKind, IBlockTabKind} from "@/entities/ConstructorEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {
  ReferencedInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/ReferencedInstanceEditor/ReferencedInstanceEditor";
import {InlineEdit2} from "@/components/shared/InlineEdit2/InlineEdit2";

export interface IBlockInstanceEditorProps {
  blockInstanceUuid: string;
}



export const BlockInstanceEditor = (props: IBlockInstanceEditorProps) => {


  // Состояния для вкладок и активной вкладки
  const [tabs, setTabs] = useState<Array<{ label: string; value: string }>>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const navigate = useNavigate();
  const {isMobile} = useMedia();
  const {setTitleElement} = usePageTitle()

  const {
    blockInstance,
    block,
    updateBlockInstanceTitle,
    relatedBlocks,
    allBlocks,
    blockRelations,
    childBlocks,
    childInstancesMap,
    blockTabs,
    referencingParams,
    updateBlockInstanceShortDescription
  } = useBlockInstanceEditor(props.blockInstanceUuid);


  const header =( <Group>
    <IconViewer
        iconName={block?.icon}
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
  }, [block])
  const getTabs = () => {
    if (!blockTabs) return [{ label: 'Параметры', value: 'params' }];

    return blockTabs.map(tab => {
      switch (tab.tabKind) {
        case IBlockTabKind.relation:
          return {
            label: tab.title,
            value: `related-${tab.relationUuid}`,
          };
        case IBlockTabKind.childBlock:
          return {
            label: tab.title,
            value: `child-${tab.childBlockUuid}`,
          };
        case IBlockTabKind.referencingParam:
          return {
            label: tab.title,
            value: `referencing-param-${tab.referencingParamUuid}`,
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
      <Container size="lg" p={'xs'} style={{backgroundColor: '#FFF', minHeight: 'calc(100vh - 100px)'}} >
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
            <Group gap="0">
              <IconViewer
                  size={18}
                  iconName={block?.icon}
                  color={"#999"}
              />
              <Text
                  color="dimmed"
              >
                {block?.title}{block?.structureKind !== IBlockStructureKind.single ? ":" : ""}
              </Text>
            </Group>
            {block?.structureKind !== IBlockStructureKind.single &&
                <Box>
                  <InlineEdit2 onChange={(val) => updateBlockInstanceTitle(val)} value={blockInstance?.title || ''}/>
                </Box>
              // <InlineEdit
              //     value={blockInstance?.title || ''}
              //     placeholder="Instance title"
              //     size="md"
              //     className={classes.titleInput}
              //     onChange={(val) => updateBlockInstanceTitle(val)}
              // />
            }
          </Group>
          <Group>
          {block?.structureKind !== IBlockStructureKind.single &&
              <Box mb="lg" style={{flex: '1'}}>
                <InlineEdit2
                    label="Краткое описание"
                    placeholder="Краткое описание..."
                    onChange={(val) => updateBlockInstanceShortDescription(val)}
                    value={blockInstance?.shortDescription || ''}
                    size="sm"
                />
              </Box>
              // <InlineEdit
              //     value={blockInstance?.shortDescription || ''}
              //     placeholder="Краткое описание..."
              //     label="Краткое описание"
              //     size="xs" // Slightly smaller size for description
              //     onChange={(val) => updateBlockInstanceShortDescription(val)}
              // />
          }
          </Group>

          <section>
            <ScrollArea
                type="hover"
                offsetScrollbars
                styles={{
                  viewport: { scrollBehavior: 'smooth' },
                  root: { flex: 1 }
                }}
            >
              <SegmentedControl
                  value={activeTab || ''}
                  onChange={setActiveTab}
                  data={tabs}
                  style={{textTransform: 'Capitalize', display: tabs.length <= 1 ? 'none' : ''}}
              />
            </ScrollArea>
            {blockTabs?.map(tab => {
              const tabValue = tab.tabKind === IBlockTabKind.relation
                  ? `related-${tab.relationUuid}`
                  : tab.tabKind === IBlockTabKind.childBlock
                      ? `child-${tab.childBlockUuid}`
                      : tab.tabKind === IBlockTabKind.referencingParam
                        ? `referencing-param-${tab.referencingParamUuid}`
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
                                  allBlocks={allBlocks}
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
                        <>
                          {tab.tabKind === IBlockTabKind.referencingParam && (
                              referencingParams?.map(param => (
                                  activeTab === `referencing-param-${param.uuid}` && (
                                      <ReferencedInstanceEditor
                                          block={block}
                                          referencingParam={param}
                                          instance={blockInstance}
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
