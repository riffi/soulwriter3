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
import {BlockInstanceRepository} from "@/repository/BlockInstance/BlockInstanceRepository";
import {
    addParameterInstance,
    BlockParameterInstanceRepository,
    updateParameterInstance
} from "@/repository/BlockInstance/BlockParameterInstanceRepository";

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
            parameterInstances
                ?.map((instance) => ({
                    parameter: availableParameters?.find((p) => p.uuid === instance.blockParameterUuid),
                    instance
                }))
                .sort((a, b) => {
                    const orderA = a.parameter?.orderNumber;
                    const orderB = b.parameter?.orderNumber;

                    if (orderA == null && orderB == null) {
                        return 0;
                    }
                    if (orderA == null) {
                        return 1; // a comes after b
                    }
                    if (orderB == null) {
                        return -1; // a comes before b
                    }
                    return orderA - orderB;
                })
            : [];

    const handleSaveParameter = async (parameterUuid: string) => {
        if (!parameterUuid) return;

        const newInstance: IBlockParameterInstance = {
            blockParameterUuid: parameterUuid,
            blockInstanceUuid: blockInstanceUuid,
            blockParameterGroupUuid: currentParamGroup?.uuid || "",
            value: ""
        };

        try {
            await BlockParameterInstanceRepository.addParameterInstance(bookDb,newInstance);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Error saving parameter instance:", error);
        }
    };

    const handleDeleteParameter = async (instanceId: number) => {
        try {
            await BlockParameterInstanceRepository.deleteParameterInstance(bookDb, instanceId);
        } catch (error) {
            console.error("Error deleting parameter instance:", error);
        }
    };

    const handleUpdateParameterValue = async (instance: IBlockParameterInstance, newValue: string | number) => {
        try {
            await BlockParameterInstanceRepository.updateParameterInstance(bookDb, instance.id, {
                value: newValue
            });
        } catch (error) {
            console.error("Error updating parameter instance:", error);
        }
    };

    const handleAddNewInstance = async (blockParameterUuid: string) => {
        // Find the parameter definition to potentially set a more type-appropriate default value
        const parameterDefinition = availableParameters?.find(p => p.uuid === blockParameterUuid);
        let defaultValue: string | number = ""; // General default

        if (parameterDefinition) {
            switch (parameterDefinition.dataType) {
                case "number":
                case "checkbox": // Checkboxes often use 0 or 1
                    defaultValue = 0;
                    break;
                // case "select": // For select, might pick the first possibleValue if available
                //     defaultValue = parameterDefinition.possibleValues?.[0]?.value || "";
                //     break;
                default:
                    defaultValue = "";
            }
        }

        const newInstance: IBlockParameterInstance = {
            blockParameterUuid: blockParameterUuid,
            blockInstanceUuid: blockInstanceUuid,
            // Use currentParamGroup?.uuid if tabs are used, otherwise, it might be an empty string
            // or a specific group UUID if non-tabbed parameters belong to a default group.
            // For now, currentParamGroup?.uuid (which could be null -> undefined) or "" is fine.
            blockParameterGroupUuid: currentParamGroup?.uuid || "",
            value: defaultValue,
        };

        try {
            await BlockParameterInstanceRepository.addParameterInstance(bookDb, newInstance);
            // Data should refresh via useLiveQuery in useBlockInstanceEditor
        } catch (error) {
            console.error("Error adding new parameter instance:", error);
            // Consider adding user-facing notification here
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
                        onAddNewInstance={handleAddNewInstance} // Added prop
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
                    onAddNewInstance={handleAddNewInstance} // Added prop
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
