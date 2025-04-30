import {
  Box,
  Group,
  Button,
  Text,
  Stack, Checkbox
} from "@mantine/core";

import classes from "../BlockInstanceEditor.module.css";
import { IBlockParameterInstance } from "@/entities/BookEntities";
import { FullParam } from "../types";
import {
  IBlockParameterDataType,
  IBlockParameterPossibleValue
} from "@/entities/ConstructorEntities";
import {
  ParameterActions
} from "@/components/blockInstance/BlockInstanceEditor/components/ParameterActionsProps";

import {ParameterRenderer} from "@/components/blockInstance/BlockInstanceEditor/components/ParameterRenderer";
import {useState} from "react";

interface ParameterListProps {
  fullParams: FullParam[];
  editingParam: string | null;
  editValue: string;
  onStartEdit: (paramUuid: string, currentValue: string) => void;
  onSaveEdit: (instance: IBlockParameterInstance) => void;
  possibleValuesMap?: Record<string, IBlockParameterPossibleValue[]>
}

export const ParameterList = ({
                                fullParams,
                                editingParam,
                                editValue,
                                onStartEdit,
                                onSaveEdit,
                                possibleValuesMap
                              }: ParameterListProps) => {
  // Состояние для отслеживания раскрытых параметров
  const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({});

  // Переключение состояния раскрытия
  const handleToggleExpand = (paramUuid: string) => {
    setExpandedParams(prev => ({
      ...prev,
      [paramUuid]: !prev[paramUuid]
    }));
  };

  return (
      <Stack gap="sm" className={classes.parametersStack}>
        {fullParams?.map((fullParam, index) => {
          const isEditing = editingParam === fullParam.instance.blockParameterUuid;
          const paramUuid = fullParam.instance.blockParameterUuid;
          const parameter = fullParam.parameter;
          const isExpanded = expandedParams[paramUuid] || false; // Проверка состояния
          const needsTruncation = fullParam.instance.value?.length > 500;

          function getParamDisplayedValue() {
            if (fullParam.parameter?.dataType === IBlockParameterDataType.checkbox){
              return <Checkbox
                  label={fullParam.parameter.title}
                  checked={fullParam.instance.value === "true"}
                  onChange={(event) =>
                      onSaveEdit(
                          {...fullParam.instance, value: event.target.checked.toString()}
                      )
                  }
              />
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

          return (
              <Box
                  key={`instance-${paramUuid}-${index}`}
                  className={classes.parameterItem}
              >
                <Group justify="space-between" align="flex-start" w="100%" className={classes.paramHeader}>
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
                               onStartEdit(paramUuid, fullParam.instance.value || "")
                           }
                           onSave={() => onSaveEdit(fullParam.instance)}
                           onDelete={() => {/* Добавьте обработчик удаления */}}
                  />
                </Group>

                <Box className={classes.textContent}>
                  <>
                  {isEditing ? (
                      <ParameterRenderer
                          dataType={parameter?.dataType || 'text'}
                          value={editValue}
                          possibleValues={possibleValuesMap?.[parameter?.uuid || '']}
                          onValueChange={(value) => onStartEdit(paramUuid, value)}
                      />
                  ) : getParamDisplayedValue()}
                  </>
                </Box>
              </Box>
          );
        })}
      </Stack>
  );
};
