import {useNavigate} from "react-router-dom";
import {
  useBlockInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/hooks/useBlockInstanceEditor";
import {ActionIcon, Box, Button, Container, Group, SegmentedControl, Tabs,} from "@mantine/core";
import {IconArrowLeft, IconPlus} from "@tabler/icons-react";
import classes from "./BlockInstanceEditor.module.css";
import {useEffect, useState} from "react";
import {IBlockParameterGroup} from "@/entities/ConstructorEntities";
import {IBlockParameterInstance} from "@/entities/BookEntities";
import {bookDb} from "@/entities/bookDb";
import {
  ParameterList
} from "@/components/blockInstance/BlockInstanceEditor/components/ParameterList";
import {FullParam} from "@/components/blockInstance/BlockInstanceEditor/types";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {
  BlockRelationsEditor
} from "@/components/blockInstance/BlockInstanceEditor/components/BlockRelationsEditor/BlockRelationsEditor";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {
  AddParameterModal
} from "@/components/blockInstance/BlockInstanceEditor/modal/AddParameterModal";
import {
  ChildInstancesTable
} from "@/components/blockInstance/BlockInstanceEditor/components/ChildInstancesTable";

export interface IBlockInstanceEditorProps {
  blockInstanceUuid: string;
}

const ParameterGroupsTabs = ({ groups, currentGroup, onChange, children }) => (
    <Tabs value={currentGroup?.uuid} onChange={value => onChange(groups.find(g => g.uuid === value))}>
      <Tabs.List className={classes.tabList}>
        {groups.map(group => (
            <Tabs.Tab key={group.uuid} value={group.uuid} className={classes.tab}>
              {group.title}
            </Tabs.Tab>
        ))}
      </Tabs.List>

      {groups.map(group => (
          <Tabs.Panel key={group.uuid} value={group.uuid} pt="md">
            {children}
          </Tabs.Panel>
      ))}
    </Tabs>
);

const ParameterContent = ({ availableParameters, fullParams, onAdd, ...props }) => (
    <Box className={classes.panelContent}>
      {availableParameters?.length > 0 && (
          <Button
              onClick={onAdd}
              leftSection={<IconPlus size="1rem" />}
              size="sm"
              variant="light"
              mb="md"
              className={classes.addButton}
          >
            Добавить параметр
          </Button>
      )}

      <ParameterList fullParams={fullParams} {...props} />
    </Box>
);

export const BlockInstanceEditor = (props: IBlockInstanceEditorProps) => {
  const [currentParamGroup, setCurrentParamGroup] = useState<IBlockParameterGroup | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Состояния для вкладок и активной вкладки
  const [tabs, setTabs] = useState<Array<{ label: string; value: string }>>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const {
    blockInstance,
    block,
    parameterGroups,
    parameterInstances,
    availableParametersWithoutInstances,
    availableParameters,
    updateBlockInstanceTitle,
    possibleValuesMap,
    relatedBlocks,
    blockRelations,
    childBlocks,
    childInstancesMap,
    blockTabs
  } = useBlockInstanceEditor(props.blockInstanceUuid, currentParamGroup);

  const navigate = useNavigate();

  useEffect(() => {
    if (parameterGroups && parameterGroups.length > 0) {
      setCurrentParamGroup(parameterGroups[0]);
    }
  }, [props.blockInstanceUuid, parameterGroups]);

  const handleAddParameter = () => {
    setIsAddModalOpen(true);
  };

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

  const handleSaveParameter = async (parameterUuid: string) => {
    if (!parameterUuid || !props.blockInstanceUuid) return;

    const newInstance: IBlockParameterInstance = {
      blockParameterUuid: parameterUuid,
      blockInstanceUuid: props.blockInstanceUuid,
      blockParameterGroupUuid: currentParamGroup?.uuid || "",
      value: "" // Значение можно задать по умолчанию при необходимости
    };

    try {
      await bookDb.blockParameterInstances.add(newInstance);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error saving parameter instance:", error);
    }
  };

  const handleDeleteParameter = async (instanceId: number) => {
    try {
      await bookDb.blockParameterInstances.delete(instanceId);
    } catch (error) {
      console.error("Error deleting parameter instance:", error);
    }
  };

  const fullParams: FullParam[] = parameterInstances?.map((instance) => {
    return {
      parameter: availableParameters?.find((p) => p.uuid === instance.blockParameterUuid),
      instance
    }
  })

  const handleUpdateParameterValue = async (instance: IBlockParameterInstance, newValue: string) => {
    try {
      await bookDb.blockParameterInstances.update(instance.id, {
        ...instance,
        value: newValue
      });
    } catch (error) {
      console.error("Error updating parameter instance:", error);
    }
  };


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
                style={{textTransform: 'Capitalize'}}
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
                              {block?.useTabs ? (
                                <ParameterGroupsTabs
                                    groups={parameterGroups}
                                    currentGroup={currentParamGroup}
                                    onChange={setCurrentParamGroup}
                                >
                                  <ParameterContent
                                      availableParameters={availableParametersWithoutInstances}
                                      fullParams={fullParams}
                                      onAdd={() => setIsAddModalOpen(true)}
                                      onSaveEdit={handleUpdateParameterValue}
                                      onDelete={handleDeleteParameter}
                                      possibleValuesMap={possibleValuesMap}
                                  />
                                </ParameterGroupsTabs>
                            ) : (
                                <ParameterContent  availableParameters={availableParametersWithoutInstances}
                                                   fullParams={fullParams}
                                                   onAdd={() => setIsAddModalOpen(true)}
                                                   onSaveEdit={handleUpdateParameterValue}
                                                   onDelete={handleDeleteParameter}
                                                   possibleValuesMap={possibleValuesMap} />
                            )}
                          </>
                        }
                      </>
                      <>
                        {tab.tabKind === 'relation' && (
                              <BlockRelationsEditor
                                  key={tab.uuid}
                                  blockInstanceUuid={props.blockInstanceUuid}
                                  blockUuid={block?.uuid}
                                  relatedBlock={getRelatedBlockByRelationUuid(tab.relationUuid)}
                                  blockRelation={blockRelations?.find(r =>
                                      r => r.uuid === tab.relationUuid
                                  )}
                              />
                        )}
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
        <AddParameterModal
            opened={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            parameters={availableParametersWithoutInstances}
            onSave={async (param) => {
              await handleSaveParameter(param)
            }}
        />
      </>
  );
};
