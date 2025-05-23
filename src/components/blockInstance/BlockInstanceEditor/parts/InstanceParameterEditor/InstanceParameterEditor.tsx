// InstanceParameterEditor.tsx
import React, {useEffect, useState} from "react";
import {
  useBlockInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/hooks/useBlockInstanceEditor";
import {
  Box,
  Button, Tabs
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import {IBlock, IBlockParameterGroup, IBlockRelation} from "@/entities/ConstructorEntities";
import { IBlockParameterInstance } from "@/entities/BookEntities";
import { bookDb } from "@/entities/bookDb";
import classes from "../../BlockInstanceEditor.module.css";
import {
  ParameterList
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/parts/ParameterList";
import {
  AddParameterModal
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/modal/AddParameterModal";
import {FullParam} from "@/components/blockInstance/BlockInstanceEditor/types";

interface InstanceParameterEditorProps {
  blockInstanceUuid: string;
  blockUseTabs: boolean;
  relatedBlocks?: IBlock[];
  allBlocks?: IBlock[];
}

const ParameterGroupsTabs = ({ groups, currentGroup, onChange, children }) => (
    <Tabs value={currentGroup?.uuid} onChange={value => onChange(groups.find(g => g.uuid === value))}>
      <Tabs.List className={classes.tabList}>
        {groups?.map(group => (
            <Tabs.Tab key={group.uuid} value={group.uuid} className={classes.tab}>
              {group.title}
            </Tabs.Tab>
        ))}
      </Tabs.List>

      {groups?.map(group => (
          <Tabs.Panel key={group.uuid} value={group.uuid} pt="md">
            {children}
          </Tabs.Panel>
      ))}
    </Tabs>
);

const ParameterGroupContent = ({ availableParameters, fullParams, onAdd, ...props }) => (
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
            свойство
          </Button>
      )}
      <ParameterList fullParams={fullParams} {...props} />
    </Box>
);

export const InstanceParameterEditor = ({
                                          blockInstanceUuid,
                                          blockUseTabs,
                                          relatedBlocks,
                                          allBlocks,
                                        }: InstanceParameterEditorProps) => {
  const [currentParamGroup, setCurrentParamGroup] = useState<IBlockParameterGroup | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    parameterInstances,
    availableParameters,
    availableParametersWithoutInstances,
    parameterGroups,
    possibleValuesMap,
  } = useBlockInstanceEditor(blockInstanceUuid, currentParamGroup);

  useEffect(() => {
    if (parameterGroups && parameterGroups.length > 0) {
      setCurrentParamGroup(parameterGroups[0]);
    }
  }, [blockInstanceUuid, parameterGroups]);

  const fullParams: FullParam[] =
      parameterInstances ?
      parameterInstances?.map((instance) => ({
        parameter: availableParameters?.find((p) => p.uuid === instance.blockParameterUuid),
        instance
      })) : [];

  const handleSaveParameter = async (parameterUuid: string) => {
    if (!parameterUuid) return;

    const newInstance: IBlockParameterInstance = {
      blockParameterUuid: parameterUuid,
      blockInstanceUuid: blockInstanceUuid,
      blockParameterGroupUuid: currentParamGroup?.uuid || "",
      value: ""
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

  const handleUpdateParameterValue = async (instance: IBlockParameterInstance, newValue: string | number) => {
    try {
      await bookDb.blockParameterInstances.update(instance.id, {
        ...instance,
        value: newValue
      });
    } catch (error) {
      console.error("Error updating parameter instance:", error);
    }
  };

  return (
      <>
        {blockUseTabs ? (
            <ParameterGroupsTabs
                groups={parameterGroups}
                currentGroup={currentParamGroup}
                onChange={setCurrentParamGroup}
            >
              <ParameterGroupContent
                  availableParameters={availableParametersWithoutInstances}
                  fullParams={fullParams}
                  onAdd={() => setIsAddModalOpen(true)}
                  onSaveEdit={handleUpdateParameterValue}
                  onDelete={handleDeleteParameter}
                  possibleValuesMap={possibleValuesMap}
                  relatedBlocks={relatedBlocks}
                  allBlocks={allBlocks}
              />
            </ParameterGroupsTabs>
        ) : (
            <ParameterGroupContent
                availableParameters={availableParametersWithoutInstances}
                fullParams={fullParams}
                onAdd={() => setIsAddModalOpen(true)}
                onSaveEdit={handleUpdateParameterValue}
                onDelete={handleDeleteParameter}
                possibleValuesMap={possibleValuesMap}
                relatedBlocks={relatedBlocks}
                allBlocks={allBlocks}
            />
        )}

        <AddParameterModal
            opened={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            parameters={availableParametersWithoutInstances}
            onSave={handleSaveParameter}
        />
      </>
  );
};
