import { ActionIcon, Box, Button, Checkbox, Group, Stack, Text } from "@mantine/core";
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
import { useState } from "react";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { ParameterViewVariantRenderer } from "@/components/shared/blockParameter/ParameterViewVariantRenderer/ParameterViewVariantRenderer";

interface ParameterListProps {
    fullParams: FullParam[];
    onSaveEdit: (instance: IBlockParameterInstance, newValue: string | number) => void;
    onDelete?: (instanceId: number) => void;
    possibleValuesMap?: Record<string, IBlockParameterPossibleValue[]>;
    relatedBlocks?: IBlock[];
    allBlocks?: IBlock[];
}

function CheckBoxParameterInstanceViewer(props: {
    fullParam: FullParam;
    onChange: (value: number) => void;
    onDelete: () => Promise<void>;
}) {
    return (
        <Group justify="space-between" align="center" w="100%">
            <Checkbox
                label={props.fullParam.parameter?.title}
                checked={props.fullParam.instance.value === 1}
                onChange={(e) => props.onChange(e.currentTarget.checked ? 1 : 0)}
            />
            {props.fullParam.parameter?.isDefault !== 1 && (
                <ActionIcon variant="subtle" color="red" onClick={props.onDelete}>
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
                                  possibleValuesMap,
                                  relatedBlocks,
                                  allBlocks,
                              }: ParameterListProps) => {
    const [editingParam, setEditingParam] = useState<number | null>(null); // Changed to number
    const [editValue, setEditValue] = useState("");
    const { showDialog } = useDialog();

    // Changed paramUuid to instanceId
    const handleStartEdit = (instanceId: number, currentValue: string) => {
        setEditingParam(instanceId);
        setEditValue(currentValue);
    };

    return (
        <Stack gap="sm" className={classes.parametersStack}>
            {fullParams?.map((fullParam, index) => {
                // isEditing now compares with instance.id
                const isEditing = editingParam === fullParam.instance.id;
                const paramUuid = fullParam.instance.blockParameterUuid; // Keep for other uses if any
                const parameter = fullParam.parameter;

                function renderHeader() {
                    return (
                        <Group
                            justify="space-between"
                            align="flex-start"
                            w="100%"
                            className={
                                isEditing &&
                                editingParam === parameter?.uuid &&
                                parameter?.dataType === IBlockParameterDataType.text
                                    ? classes.paramHeaderEditingMode
                                    : classes.paramHeader
                            }
                        >
                            <Text
                                fw={500}
                                color={"dimmed"}
                                style={{ fontSize: "0.8rem" }}
                                className={classes.paramTitle}
                            >
                                {parameter?.title}
                            </Text>
                            <ParameterActions
                                isEditing={isEditing}
                                // Pass instance.id to handleStartEdit
                                onEdit={() => handleStartEdit(fullParam.instance.id, fullParam.instance.value || "")}
                                onSave={() => {
                                    onSaveEdit(fullParam.instance, editValue);
                                    setEditingParam(null);
                                    setEditValue("");
                                }}
                                onDelete={async () => {
                                    const result = await showDialog(
                                        "Подтверждение",
                                        `Удалить ${parameter?.title || "Параметр"}?`
                                    );
                                    if (!result) return;
                                    onDelete?.(fullParam.instance.id);
                                }}
                                isDefault={fullParam.parameter?.isDefault}
                            />
                        </Group>
                    );
                }

                return (
                    // Changed key to use instance.id for uniqueness, with fallback to index
                    <Box key={`instance-${paramUuid}-${fullParam.instance.id || index}`} className={classes.parameterItem}>
                        {fullParam.parameter?.dataType === IBlockParameterDataType.checkbox ? (
                            <CheckBoxParameterInstanceViewer
                                fullParam={fullParam}
                                onChange={(value) => onSaveEdit(fullParam.instance, value)}
                                onDelete={async () => {
                                    const result = await showDialog(
                                        "Подтверждение",
                                        `Удалить ${fullParam.parameter?.title || "Параметр"}?`
                                    );
                                    if (!result) return;
                                    onDelete?.(fullParam.instance.id);
                                }}
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
                                        <Box ml={10} >
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
            })}
        </Stack>
    );
};
