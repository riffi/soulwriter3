import { ActionIcon, Box, Button, Checkbox, Drawer, Group, Stack, Text } from "@mantine/core";
import classes from "../../../BlockInstanceEditor.module.css";
import { IBlockParameterInstance } from "@/entities/BookEntities";
import { FullParam } from "../../../types";
import {
    IBlock,
    IBlockParameterDataType,
    IBlockParameterPossibleValue
} from "@/entities/ConstructorEntities";
import { ParameterActions } from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/parts/ParameterActionsProps";
import { ParameterEditVariantRenderer } from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/parts/ParameterEditVariantRenderer";
import { useState, useMemo } from "react";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import { IconEdit, IconTrash, IconPlus, IconQuestionMark } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { ParameterViewVariantRenderer } from "@/components/shared/blockParameter/ParameterViewVariantRenderer/ParameterViewVariantRenderer";
import { useLiveQuery } from "dexie-react-hooks";
import { KnowledgeBaseRepository } from "@/repository/KnowledgeBaseRepository";
import { bookDb } from "@/entities/bookDb";
import { KnowledgeBaseViewer } from "@/components/knowledgeBase/KnowledgeBaseViewer";
import { useBookStore } from "@/stores/bookStore/bookStore";
import type { IKnowledgeBasePage } from "@/entities/KnowledgeBaseEntities";

interface ParameterListProps {
    fullParams: FullParam[];
    onSaveEdit: (instance: IBlockParameterInstance, newValue: string | number) => void;
    onDelete?: (instanceId: number) => void;
    onAddNewInstance?: (blockParameterUuid: string) => void; // Added new prop
    possibleValuesMap?: Record<string, IBlockParameterPossibleValue[]>;
    relatedBlocks?: IBlock[];
    allBlocks?: IBlock[];
}

// CheckBoxParameterInstanceViewer remains largely the same, but will be used per instance if allowMultiple is true
function CheckBoxParameterInstanceViewer(props: {
    fullParam: FullParam;
    onChange: (value: number) => void;
    onDelete: () => Promise<void>; // Keep onDelete for individual checkbox instances if needed
    isMultiple: boolean; // Added to control display for multiple items
    parameterTitle?: string; // Added to display title correctly
}) {
    return (
        <Group justify="space-between" align="center" w="100%">
            <Checkbox
                // For single checkboxes, label is the parameter title. For multiple, it might be empty or specific.
                label={!props.isMultiple ? props.parameterTitle : `${props.fullParam.instance.value === 1 ? "Checked" : "Unchecked"}`}
                checked={props.fullParam.instance.value === 1}
                onChange={(e) => props.onChange(e.currentTarget.checked ? 1 : 0)}
            />
            {/* For multiple instances, delete is handled per instance.
                For single, non-default instances, delete is handled as before.
                 */}
            {(props.isMultiple || props.fullParam.parameter?.isDefault !== 1) && (
                <ActionIcon variant="subtle" color="red" onClick={props.onDelete} title="Delete this item">
                    <IconTrash size="1rem" />
                </ActionIcon>
            )}
        </Group>
    );
}

export const ParameterList = ({
                                  fullParams,
                                  onSaveEdit,
                                  onDelete,
                                  onAddNewInstance, // New prop
                                  possibleValuesMap,
                                  relatedBlocks,
                                  allBlocks,
                              }: ParameterListProps) => {
    const [editingParamInstanceId, setEditingParamInstanceId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string | number>(""); // Can be number for checkbox/numeric types
    const { showDialog } = useDialog();
    const navigate = useNavigate(); // Assuming navigate might be used, kept from original context if needed elsewhere

    const { selectedBook } = useBookStore();

    const knowledgeBasePages = useLiveQuery(
        async () => {
            const uuids = fullParams
                .map(fp => fp.parameter?.knowledgeBasePageUuid)
                .filter((u): u is string => !!u);
            if (uuids.length === 0) return [] as IKnowledgeBasePage[];
            return bookDb.knowledgeBasePages.where('uuid').anyOf(uuids).toArray();
        },
        [fullParams]
    ) || [];

    const knowledgeBaseMap = useMemo(() => {
        const map: Record<string, IKnowledgeBasePage> = {};
        knowledgeBasePages.forEach(p => {
            if (p.uuid) map[p.uuid] = p;
        });
        return map;
    }, [knowledgeBasePages]);

    const [kbDrawerOpen, setKbDrawerOpen] = useState(false);
    const [kbPageUuid, setKbPageUuid] = useState<string | null>(null);

    const openKbDrawer = (uuid: string) => {
        setKbPageUuid(uuid);
        setKbDrawerOpen(true);
    };

    const handleStartEdit = (instanceId: number, currentValue: string | number) => {
        setEditingParamInstanceId(instanceId);
        setEditValue(currentValue);
    };

    const handleCancelEdit = () => {
        setEditingParamInstanceId(null);
        setEditValue("");
    };

    const handleSaveEdit = (instance: IBlockParameterInstance) => {
        onSaveEdit(instance, editValue);
        handleCancelEdit();
    };

    // Group parameters by blockParameterUuid
    const groupedParams = fullParams.reduce((acc, param) => {
        const key = param.instance.blockParameterUuid;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(param);
        return acc;
    }, {} as Record<string, FullParam[]>);

    return (
        <>
        <Stack gap="lg" className={classes.parametersStack}> {/* Increased gap for groups */}
            {Object.entries(groupedParams).map(([blockParameterUuid, group]) => {
                const firstParamInGroup = group[0];
                const parameter = firstParamInGroup.parameter;

                if (!parameter) return null; // Should not happen with valid data

                // Handle parameters that allow multiple instances
                if (parameter.allowMultiple) {
                    // Determine if any instance in this group is currently being edited.
                    // This is to apply paramHeaderEditingMode if needed, though for multi-select,
                    // editing happens per-instance, not at the group header level.
                    // For now, we'll use the standard paramHeader class.
                    // const isAnyInstanceInGroupEditing = group.some(fp => editingParamInstanceId === fp.instance.id);
                    // const headerClass = isAnyInstanceInGroupEditing && parameter.dataType === IBlockParameterDataType.text ? classes.paramHeaderEditingMode : classes.paramHeader;
                    // Simplified: multi-instance header doesn't show global edit state.
                    const headerClass = classes.paramHeader;

                    return (
                        <Box key={`group-${blockParameterUuid}`} className={classes.parameterGroup}>
                            <Group className={headerClass} justify="space-between" w="100%">
                                <Group gap="xs">
                                    <Text
                                        fw={500}
                                        color={"dimmed"}
                                        style={{ fontSize: "0.8rem" }}
                                    >
                                        {parameter.title}
                                    </Text>
                                    {parameter.knowledgeBasePageUuid && knowledgeBaseMap[parameter.knowledgeBasePageUuid] && (
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => openKbDrawer(parameter.knowledgeBasePageUuid!)}
                                            title="Статья"
                                        >
                                            <IconQuestionMark size="1rem" />
                                        </ActionIcon>
                                    )}
                                </Group>
                                {onAddNewInstance && (
                                    <ActionIcon
                                        variant="subtle" // Consistent with other header action icons
                                        onClick={() => onAddNewInstance(blockParameterUuid)}
                                        title={`Add new ${parameter.title}`}
                                        aria-label={`Add new ${parameter.title}`}
                                    >
                                        <IconPlus size="1rem" />
                                    </ActionIcon>
                                )}
                            </Group>
                            <Stack gap="sm" pl="md" pt="xs"> {/* Added pt="xs" for space below new header */}
                                {group.map((fullParam) => {
                                    const isEditingThisInstance = editingParamInstanceId === fullParam.instance.id;
                                    const handleDeleteInstance = async () => {
                                        const result = await showDialog(
                                            "Подтверждение",
                                            `Удалить этот экземпляр параметра "${parameter.title}"?`
                                        );
                                        if (result && onDelete) {
                                            onDelete(fullParam.instance.id);
                                        }
                                    };

                                    if (parameter.dataType === IBlockParameterDataType.checkbox) {
                                        return (
                                            <CheckBoxParameterInstanceViewer
                                                key={fullParam.instance.id}
                                                fullParam={fullParam}
                                                onChange={(value) => onSaveEdit(fullParam.instance, value)}
                                                onDelete={handleDeleteInstance}
                                                isMultiple={true}
                                                // parameterTitle={parameter.title} // Not needed for multiple items label
                                            />
                                        );
                                    }

                                    return (
                                        <Box key={fullParam.instance.id} className={classes.parameterInstanceItem}>
                                            {isEditingThisInstance ? (
                                                <Group w="100%" wrap="nowrap" gap="xs">
                                                    <Box style={{ flexGrow: 1 }}>
                                                        <ParameterEditVariantRenderer
                                                            dataType={parameter.dataType || "text"}
                                                            value={editValue}
                                                            parameter={parameter}
                                                            parameterInstance={fullParam.instance}
                                                            possibleValues={possibleValuesMap?.[parameter.uuid || ""]}
                                                            onValueChange={setEditValue}
                                                            relatedBlocks={relatedBlocks}
                                                            allBlocks={allBlocks}
                                                        />
                                                    </Box>
                                                    <Button onClick={() => handleSaveEdit(fullParam.instance)} size="xs">
                                                        Сохранить
                                                    </Button>
                                                    <Button variant="default" onClick={handleCancelEdit} size="xs">
                                                        Отменить
                                                    </Button>
                                                </Group>
                                            ) : (
                                                <Group justify="space-between" w="100%" wrap="nowrap" gap="xs">
                                                    <Box style={{ flexGrow: 1 }}> {/* Removed inline paddingLeft */}
                                                        <ParameterViewVariantRenderer
                                                            dataType={parameter.dataType || "text"}
                                                            value={fullParam.instance.value || ""}
                                                            fontSize={14}
                                                        />
                                                    </Box>
                                                    <Group gap="xs" wrap="nowrap">
                                                        <ActionIcon
                                                            variant="subtle"
                                                            onClick={() => handleStartEdit(fullParam.instance.id, fullParam.instance.value)}
                                                            title="Edit this item"
                                                        >
                                                            <IconEdit size="1rem" />
                                                        </ActionIcon>
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="red"
                                                            onClick={handleDeleteInstance}
                                                            title="Delete this item"
                                                        >
                                                            <IconTrash size="1rem" />
                                                        </ActionIcon>
                                                    </Group>
                                                </Group>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    );
                } else {
                    // Handle single instance parameters (original logic, adapted for the single item in the group)
                    const fullParam = firstParamInGroup; // There's only one for non-allowMultiple
                    const isEditing = editingParamInstanceId === fullParam.instance.id;

                    function renderHeader() { // This specific renderHeader is for single, non-multiple params
                        return (
                            <Group
                                justify="space-between"
                                align="flex-start"
                                w="100%"
                                className={
                                    isEditing &&
                                    parameter?.dataType === IBlockParameterDataType.text // Keep existing class logic for text
                                        ? classes.paramHeaderEditingMode
                                        : classes.paramHeader
                                }
                            >
                                <Group gap="xs">
                                    <Text
                                        fw={500}
                                        color={"dimmed"}
                                        style={{ fontSize: "0.8rem" }}
                                        className={classes.paramTitle}
                                    >
                                        {parameter?.title}
                                    </Text>
                                    {parameter?.knowledgeBasePageUuid && knowledgeBaseMap[parameter.knowledgeBasePageUuid] && (
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => openKbDrawer(parameter.knowledgeBasePageUuid!)}
                                            title="Статья"
                                        >
                                            <IconQuestionMark size="1rem" />
                                        </ActionIcon>
                                    )}
                                </Group>
                                <ParameterActions
                                    isEditing={isEditing}
                                    onEdit={() => handleStartEdit(fullParam.instance.id, fullParam.instance.value || "")}
                                    onSave={() => handleSaveEdit(fullParam.instance)}
                                    onCancel={handleCancelEdit}
                                    onDelete={async () => {
                                        const result = await showDialog(
                                            "Подтверждение",
                                            `Удалить ${parameter?.title || "Параметр"}?`
                                        );
                                        if (!result) return;
                                        if (onDelete) onDelete(fullParam.instance.id);
                                    }}
                                    isDefault={parameter?.isDefault}
                                />
                            </Group>
                        );
                    }

                    return (
                        <Box key={`instance-${blockParameterUuid}-${fullParam.instance.id}`} className={classes.parameterItem}>
                            {parameter?.dataType === IBlockParameterDataType.checkbox ? (
                                <CheckBoxParameterInstanceViewer
                                    fullParam={fullParam}
                                    onChange={(value) => onSaveEdit(fullParam.instance, value)}
                                    onDelete={async () => {
                                        const result = await showDialog(
                                            "Подтверждение",
                                            `Удалить ${parameter?.title || "Параметр"}?`
                                        );
                                        if (!result) return;
                                        if (onDelete) onDelete(fullParam.instance.id);
                                    }}
                                    isMultiple={false}
                                    parameterTitle={parameter?.title}
                                />
                            ) : (
                                <>
                                    {renderHeader()}
                                    <Box className={classes.textContent}>
                                        {isEditing ? (
                                            <ParameterEditVariantRenderer
                                                dataType={parameter?.dataType || "text"}
                                                value={editValue}
                                                parameter={parameter}
                                                parameterInstance={fullParam.instance}
                                                possibleValues={possibleValuesMap?.[parameter?.uuid || ""]}
                                                onValueChange={setEditValue}
                                                relatedBlocks={relatedBlocks}
                                                allBlocks={allBlocks}
                                            />
                                        ) : (
                                            <Box ml={10}>
                                                <ParameterViewVariantRenderer
                                                    dataType={parameter?.dataType || "text"}
                                                    value={fullParam.instance.value || ""}
                                                    fontSize={16}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </>
                            )}
                        </Box>
                    );
                }
            })}
        </Stack>
        <Drawer
            opened={kbDrawerOpen}
            onClose={() => setKbDrawerOpen(false)}
            size="xl"
            position="right"
            title={kbPageUuid ? knowledgeBaseMap[kbPageUuid]?.title : undefined}
        >
            {kbPageUuid && (
                <KnowledgeBaseViewer uuid={kbPageUuid} bookUuid={selectedBook?.uuid} />
            )}
        </Drawer>
    </>
    );
};
