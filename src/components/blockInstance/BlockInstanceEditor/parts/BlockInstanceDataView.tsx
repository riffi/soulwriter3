import React, { useState, useEffect } from 'react';
import { Box, ScrollArea, SegmentedControl } from '@mantine/core';
import { IBlock, IBlockTab, IBlockRelation, IBlockParameter, IBlockTabKind } from '@/entities/ConstructorEntities';
import { IBlockInstance as BookBlockInstanceEntity } from '@/entities/BookEntities'; // Renamed to avoid conflict
import { InstanceParameterEditor } from './InstanceParameterEditor/InstanceParameterEditor';
import { InstanceRelationsEditor } from './InstanceRelationsEditor/InstanceRelationsEditor';
import { ChildInstancesTable } from './InstanceChildrenEditor/ChildInstancesTable';
import { ReferencedInstanceEditor } from './ReferencedInstanceEditor/ReferencedInstanceEditor';
import { InstanceScenesEditor } from './InstanceScenesEditor/InstanceScenesEditor';
import { relationUtils } from '@/utils/relationUtils'; // Assuming this path
// import classes from './BlockInstanceDataView.module.css'; // CSS module currently unused

// import editorClasses from '../BlockInstanceEditor.module.css'; // If some classes are still shared

export interface BlockInstanceDataViewProps {
  blockInstanceUuid: string;
  block: IBlock | null | undefined;
  blockInstance: BookBlockInstanceEntity | null | undefined;
  blockTabs: IBlockTab[] | undefined;
  relatedBlocks?: IBlock[]; // From useBlockRelations
  allBlocks?: IBlock[]; // From useBlockRelations, if needed by InstanceParameterEditor directly
  blockRelations?: IBlockRelation[]; // From useBlockRelations
  childBlocks?: IBlock[]; // From useBlockChildren
  childInstancesMap?: Map<string, BookBlockInstanceEntity[]>; // From useBlockChildren
  referencingParams?: IBlockParameter[]; // From useReferencingParameters
}

export const BlockInstanceDataView: React.FC<BlockInstanceDataViewProps> = ({
  blockInstanceUuid,
  block,
  blockInstance,
  blockTabs,
  relatedBlocks,
  allBlocks,
  blockRelations,
  childBlocks,
  childInstancesMap,
  referencingParams,
}) => {
  const [tabs, setTabs] = useState<Array<{ label: string; value: string }>>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const getTabs = () => {
    if (!blockTabs) return [{ label: 'Параметры', value: 'params' }]; // Default tab

    return blockTabs.map(tab => {
      switch (tab.tabKind) {
        case IBlockTabKind.relation:
          return { label: tab.title, value: `related-${tab.relationUuid}` };
        case IBlockTabKind.childBlock:
          return { label: tab.title, value: `child-${tab.childBlockUuid}` };
        case IBlockTabKind.referencingParam:
          return { label: tab.title, value: `referencing-param-${tab.referencingParamUuid}` };
        case IBlockTabKind.scenes:
          return { label: tab.title, value: 'scenes' };
        default: // parameters
          return { label: tab.title, value: 'params' };
      }
    });
  };

  useEffect(() => {
    const newTabs = getTabs();
    setTabs(newTabs);
    if (newTabs.length > 0 && !activeTab) { // Set active tab only if not already set or new tabs are different
        const currentActiveExists = newTabs.some(t => t.value === activeTab);
        if (!currentActiveExists) {
            setActiveTab(newTabs[0].value);
        } else if (!activeTab && newTabs.length > 0) {
             setActiveTab(newTabs[0].value);
        }
    } else if (newTabs.length === 0) {
        setActiveTab(null);
    }
  }, [blockTabs]);


  const getRelatedBlockByRelationUuid = (relationUuid: string | undefined) => {
    if (!relationUuid) return undefined;
    // Ensure blockRelations and relatedBlocks are defined before calling
    return relationUtils.getRelatedBlockByRelationUuid(blockRelations || [], relatedBlocks || [], relationUuid);
  };

  return (
    <Box> {/* Removed p="sm" from here, can be added if needed */}
      <section>
        {tabs.length > 1 && ( // Only show SegmentedControl if more than one tab
            <ScrollArea
                type="hover"
                offsetScrollbars
                // styles={{ root: { flex: 1 } }} // Removed display:none logic, handled by outer condition
            >
            <SegmentedControl
                value={activeTab || ''}
                onChange={setActiveTab}
                data={tabs}
                style={{ textTransform: 'Capitalize', minWidth: '100%'}}
            />
            </ScrollArea>
        )}
        {blockTabs?.map(tab => {
          const tabValue = tab.tabKind === IBlockTabKind.relation
              ? `related-${tab.relationUuid}`
              : tab.tabKind === IBlockTabKind.childBlock
                  ? `child-${tab.childBlockUuid}`
                  : tab.tabKind === IBlockTabKind.referencingParam
                      ? `referencing-param-${tab.referencingParamUuid}`
                      : tab.tabKind === IBlockTabKind.scenes
                          ? 'scenes'
                          : 'params';

          if (activeTab !== tabValue) {
            return null;
          }

          return (
            <Box key={tab.uuid} pt="md"> {/* Added pt="md" for spacing below tabs */}
              {tab.tabKind === 'parameters' && (
                <InstanceParameterEditor
                  blockInstanceUuid={blockInstanceUuid}
                  blockUuid={block?.uuid}
                  blockUseTabs={block?.useTabs === 1}
                  relatedBlocks={relatedBlocks}
                  allBlocks={allBlocks} // Pass allBlocks if InstanceParameterEditor needs it
                  // relations prop was blockRelations, ensure it's passed if needed by ParameterValueEditor
                />
              )}
              {tab.tabKind === 'relation' && (() => {
                const currentRelatedBlock = getRelatedBlockByRelationUuid(tab.relationUuid);
                return currentRelatedBlock && (
                  <InstanceRelationsEditor
                    key={tab.uuid}
                    blockInstanceUuid={blockInstanceUuid}
                    blockUuid={block?.uuid}
                    relatedBlock={currentRelatedBlock}
                    blockRelation={blockRelations?.find(r => r.uuid === tab.relationUuid)}
                  />
                );
              })()}
              {tab.tabKind === 'childBlock' &&
                childBlocks?.filter(cb => cb.uuid === tab.childBlockUuid).map(currentChildBlock => (
                  <ChildInstancesTable
                    key={currentChildBlock.uuid}
                    blockUuid={currentChildBlock.uuid} // This is the specific child block's UUID
                    blockInstanceUuid={blockInstanceUuid} // Parent instance
                    instances={childInstancesMap?.get(currentChildBlock.uuid) || []}
                    relatedBlock={currentChildBlock} // Pass the childBlock definition
                    // structureKind={currentChildBlock.structureKind} // Already in relatedBlock
                  />
                ))
              }
              {tab.tabKind === IBlockTabKind.referencingParam &&
                referencingParams?.filter(p => p.uuid === tab.referencingParamUuid).map(currentReferencingParam => (
                  <ReferencedInstanceEditor
                    key={currentReferencingParam.uuid}
                    block={block!} // block should exist if referencing params are relevant
                    referencingParam={currentReferencingParam}
                    instance={blockInstance!} // blockInstance should exist
                  />
                ))
              }
              {tab.tabKind === IBlockTabKind.scenes && (
                <InstanceScenesEditor
                  blockInstanceUuid={blockInstanceUuid}
                  blockUuid={blockInstance?.blockUuid || ''}
                />
              )}
            </Box>
          );
        })}
        {tabs.length === 0 && <Box pt="md"><p>No tabs configured for this block.</p></Box>}
      </section>
    </Box>
  );
};

export default BlockInstanceDataView;
