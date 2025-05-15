import {
  Box,
  Group,
  Button,
  Text,
  Stack, Checkbox, ActionIcon
} from "@mantine/core";

import classes from "../../../BlockInstanceEditor.module.css";
import { IBlockParameterInstance } from "@/entities/BookEntities";
import { FullParam } from "../../../types";
import {
  IBlockParameterDataType,
  IBlockParameterPossibleValue
} from "@/entities/ConstructorEntities";
import {
  ParameterActions
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/parts/ParameterActionsProps";

import {ParameterEditVariantRenderer} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/parts/ParameterEditVariantRenderer";
import {useState} from "react";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {IconTrash} from "@tabler/icons-react";

interface ParameterListProps {
  fullParams: FullParam[];
  onSaveEdit: (instance: IBlockParameterInstance, newValue: string | number ) => void;
  onDelete?: (instanceId: number) => void;
  possibleValuesMap?: Record<string, IBlockParameterPossibleValue[]>;
}

function CheckBoxParameterInstanceViewer(props: {
  fullParam: FullParam,
  onChange: (value: number) => void,
  onDelete: () => Promise<void>
}) {
  return <Group justify="space-between" align="center" w="100%">
    <Checkbox
        label={props.fullParam.parameter?.title}
        checked={props.fullParam.instance.value === 1}
        onChange={(e) =>  props.onChange(e.currentTarget.checked ? 1 : 0)}
    />
    {props.fullParam.parameter?.isDefault !== 1 && (
        <ActionIcon
            variant="subtle"
            color="red"
            onClick={props.onDelete}
        >
          <IconTrash size="1rem"/>
        </ActionIcon>
    )}
  </Group>;
}

export const ParameterList = ({
                                fullParams,
                                onSaveEdit,
                                onDelete,
                                possibleValuesMap
                              }: ParameterListProps) => {
  // Состояние для редактирования параметра
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const {showDialog} = useDialog()

  // Состояние для сворачивания длинного текста
  const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({});

  // Переключение состояния раскрытия
  const handleToggleExpand = (paramUuid: string) => {
    setExpandedParams(prev => ({
      ...prev,
      [paramUuid]: !prev[paramUuid]
    }));
  };

  const handleStartEdit = (paramUuid: string, currentValue: string) => {
    setEditingParam(paramUuid);
    setEditValue(currentValue);
  };

  return (
      <Stack gap="sm" className={classes.parametersStack}>
        {fullParams?.map((fullParam, index) => {
          const isEditing = editingParam === fullParam.instance.blockParameterUuid;
          const paramUuid = fullParam.instance.blockParameterUuid;
          const parameter = fullParam.parameter;
          const isExpanded = expandedParams[paramUuid] || false; // Проверка состояния
          const needsTruncation = fullParam.instance.value?.length > 500;

          function renderViewMode() {
            if (parameter?.dataType === IBlockParameterDataType.colorPicker) {
              return (
                  <Box style={{
                    margin: '5px 2px',
                    borderRadius: 5,
                    height: 20,
                    width: 60,
                    backgroundColor: fullParam.instance.value
                  }}>
                  </Box>
              )
            }
            return <Text component="div" className={classes.contentWrapper}>
              <div
                  dangerouslySetInnerHTML={{__html: fullParam.instance.value || "Не указано"}}
                  className={`${classes.htmlContent} ${
                      !isExpanded && needsTruncation ? classes.clampedContent : ""
                  }`}
              />
              <>
              {needsTruncation && (
                  <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => handleToggleExpand(paramUuid)}
                      className={classes.toggleButton}
                  >
                    {isExpanded ? "Свернуть" : "Показать полностью"}
                  </Button>
              )}
              </>
            </Text>;
          }

          function renderEditMode() {
            return (
              <ParameterEditVariantRenderer
                  dataType={parameter?.dataType || 'text'}
                  value={editValue}
                  possibleValues={possibleValuesMap?.[parameter?.uuid || '']}
                  onValueChange={setEditValue}
              />
            )
          }

          function renderHeader(){
            return (
            <Group
                justify="space-between"
                align="flex-start"
                w="100%"
                className={
                  (isEditing
                      && editingParam === parameter?.uuid
                      && parameter?.dataType === IBlockParameterDataType.text
                  ) ? classes.paramHeaderEditingMode : classes.paramHeader
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
                  onEdit={() =>
                      handleStartEdit(paramUuid, fullParam.instance.value || "")
                  }
                  onSave={() => {
                    onSaveEdit(fullParam.instance, editValue);
                    setEditingParam(null);
                    setEditValue("");
                  }}
                  onDelete={async () => {
                    const result = await showDialog("Подтверждение", `Удалить ${parameter?.title || "Параметр"} ?`)
                    if (!result) return
                    onDelete?.(fullParam.instance.id)
                  }}
                  isDefault={fullParam.parameter?.isDefault}
              />
            </Group>
            )
          }

          return (
              <Box
                  key={`instance-${paramUuid}-${index}`}
                  className={classes.parameterItem}
              >
                <>
                  {(fullParam.parameter?.dataType === IBlockParameterDataType.checkbox) && (
                  <CheckBoxParameterInstanceViewer fullParam={fullParam}
                    onChange={(value) =>
                        onSaveEdit(
                            fullParam.instance,
                            value
                        )
                    }
                    onDelete={async () => {
                      const result = await showDialog("Подтверждение", `Удалить ${fullParam.parameter?.title || "Параметр"}?`);
                      if (!result) return;
                      onDelete?.(fullParam.instance.id);
                    }}
                  />)}
                </>
                <>
                {(fullParam.parameter?.dataType !== IBlockParameterDataType.checkbox) && (
                  <>
                    <>
                      {renderHeader()}
                    </>
                    <Box className={classes.textContent}>
                      <>
                        {isEditing ? renderEditMode()  : renderViewMode()}
                      </>
                    </Box>
                  </>
                )}
                </>
              </Box>
          );
        })}
      </Stack>
  );
};
