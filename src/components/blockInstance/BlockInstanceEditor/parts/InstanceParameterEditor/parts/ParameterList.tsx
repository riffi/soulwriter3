import {ActionIcon, Box, Button, Checkbox, Group, Stack, Text} from "@mantine/core";

import classes from "../../../BlockInstanceEditor.module.css";
import {IBlockParameterInstance} from "@/entities/BookEntities";
import {FullParam} from "../../../types";
import {
  IBlock,
  IBlockParameterDataType,
  IBlockParameterPossibleValue,
  IBlockRelation
} from "@/entities/ConstructorEntities";
import {
  ParameterActions
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/parts/ParameterActionsProps";

import {
  ParameterEditVariantRenderer
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/parts/ParameterEditVariantRenderer";
import {useState} from "react";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {IconEdit, IconLink, IconNavigation, IconTrash} from "@tabler/icons-react";
import {useLiveQuery} from "dexie-react-hooks";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";
import {bookDb} from "@/entities/bookDb";
import {useNavigate} from "react-router-dom";

interface ParameterListProps {
  fullParams: FullParam[];
  onSaveEdit: (instance: IBlockParameterInstance, newValue: string | number ) => void;
  onDelete?: (instanceId: number) => void;
  possibleValuesMap?: Record<string, IBlockParameterPossibleValue[]>;
  relatedBlocks?: IBlock[];
  allBlocks?: IBlock[];
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
                                possibleValuesMap,
                                relatedBlocks,
                                allBlocks,
                              }: ParameterListProps) => {
  // Состояние для редактирования параметра
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const {showDialog} = useDialog()
  const navigate = useNavigate()

  // Связанные инстансы для параметров типа relation
  const relatedInstances = useLiveQuery(async () => {
    if (!fullParams || !fullParams.length) {
      return []
    }
    const instanceUuids = fullParams
    .filter(param =>
        param.parameter !== undefined
        && param.parameter?.dataType === IBlockParameterDataType.blockLink
        && param.instance.value !== null
        && param.instance.value !== undefined
    )
    .map(param => String(param.instance.value))
    return BlockInstanceRepository.getByUuidList(bookDb, instanceUuids)
  }, [fullParams])

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
            if (parameter?.dataType === IBlockParameterDataType.blockLink) {
              const instance = relatedInstances?.find(i => i.uuid === String(fullParam.instance.value))
              return (
                  <Group className={classes.contentWrapper}>
                    <Text component="div" >
                      {instance?.title ?? 'Не указано'}
                    </Text>
                    {instance &&
                      <ActionIcon
                          size="18"
                          variant="subtle"
                          onClick={() => {
                            navigate('/block-instance/card?uuid=' + instance?.uuid)
                          }}
                      >
                        <IconLink />
                      </ActionIcon>
                    }

                  </Group>
              )
            }
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
                  parameter={parameter}
                  parameterInstance={fullParam.instance}
                  possibleValues={possibleValuesMap?.[parameter?.uuid || '']}
                  onValueChange={setEditValue}
                  relatedBlocks={relatedBlocks}
                  allBlocks={allBlocks}
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
