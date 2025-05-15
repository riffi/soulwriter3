import {useNavigate} from "react-router-dom";
import {
  useBlockInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/hooks/useBlockInstanceEditor";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  SegmentedControl,
  Tabs,
  Title,
} from "@mantine/core";
import {IconArrowLeft, IconPlus} from "@tabler/icons-react";
import classes from "./BlockInstanceEditor.module.css";
import React, {useEffect, useState} from "react";
import {IBlockParameterGroup} from "@/entities/ConstructorEntities";
import {IBlockParameterInstance} from "@/entities/BookEntities";
import {bookDb} from "@/entities/bookDb";
import {
  ParameterList
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/parts/ParameterList";
import {FullParam} from "@/components/blockInstance/BlockInstanceEditor/types";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {
  InstanceRelationsEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceRelationsEditor/InstanceRelationsEditor";
import {
  AddParameterModal
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/modal/AddParameterModal";
import {
  ChildInstancesTable
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceChildrenEditor/ChildInstancesTable";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";
import {
  InstanceParameterEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/InstanceParameterEditor";

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
    const relation = blockRelations?.find(r =>
        r.uuid === relationUuid
    )
    return relatedBlocks?.find(block =>
        (block.uuid === relation.sourceBlockUuid)
        || (block.uuid === relation.targetBlockUuid)
    );
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
