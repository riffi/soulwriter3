import {
  Box,
  Group,
  Text,
  Stack
} from "@mantine/core";

import classes from "../BlockInstanceEditor.module.css";
import { IBlockParameterInstance } from "@/entities/BookEntities";
import { FullParam } from "../types";
import {IBlockParameterPossibleValue} from "@/entities/ConstructorEntities";
import {
  ParameterActions
} from "@/components/blockInstance/BlockInstanceEditor/components/ParameterActionsProps";

import {ParameterRenderer} from "@/components/blockInstance/BlockInstanceEditor/components/ParameterRenderer";

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
  return (
      <Stack gap="sm" className={classes.parametersStack}>
        {fullParams?.map((fullParam, index) => {
          const isEditing = editingParam === fullParam.instance.blockParameterUuid;
          const paramUuid = fullParam.instance.blockParameterUuid;
          const parameter = fullParam.parameter;

          return (
              <Box
                  key={`instance-${paramUuid}-${index}`}
                  className={classes.parameterItem}
                  p="md"
              >
                <Group justify="space-between" align="flex-start" w="100%">
                  <Box style={{ flex: 1, maxWidth: "100%" }}>
                    <Text fw={500} mb="xs">{parameter?.title}</Text>

                    <>
                    {isEditing ? (
                        <ParameterRenderer
                            dataType={parameter?.dataType || 'text'}
                            value={editValue}
                            possibleValues={possibleValuesMap?.[parameter?.uuid || '']}
                            onValueChange={(value) => onStartEdit(paramUuid, value)}
                        />
                    ) : (
                        <Text component="div" className={classes.contentWrapper}>
                          <div
                              dangerouslySetInnerHTML={{
                                __html: fullParam.instance.value || "Не указано"
                              }}
                              className={classes.htmlContent}
                          />
                        </Text>
                    )}
                    </>
                  </Box>

                  <ParameterActions
                      isEditing={isEditing}
                      onEdit={() =>
                          onStartEdit(paramUuid, fullParam.instance.value || "")
                      }
                      onSave={() => onSaveEdit(fullParam.instance)}
                      onDelete={() => {/* Добавьте обработчик удаления */}}
                  />
                </Group>
              </Box>
          );
        })}
      </Stack>
  );
};
