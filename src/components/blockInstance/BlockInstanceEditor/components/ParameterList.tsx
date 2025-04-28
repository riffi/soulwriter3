import {
  Box,
  Group,
  Text,
  TextInput,
  ActionIcon,
  Stack
} from "@mantine/core";
import { IconEdit, IconCheck, IconTrash } from "@tabler/icons-react";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import classes from "../BlockInstanceEditor.module.css";
import { IBlockParameterInstance } from "@/entities/BookEntities";
import { FullParam } from "../types";

interface ParameterListProps {
  fullParams: FullParam[];
  editingParam: string | null;
  editValue: string;
  onStartEdit: (paramUuid: string, currentValue: string) => void;
  onSaveEdit: (instance: IBlockParameterInstance) => void;
}

export const ParameterList = ({
                                fullParams,
                                editingParam,
                                editValue,
                                onStartEdit,
                                onSaveEdit
                              }: ParameterListProps) => {
  return (
      <Stack gap="sm" className={classes.parametersStack}>
        {fullParams?.map((fullParam, index) => (
            <Box
                key={`instance-${fullParam.instance.blockParameterUuid}-${index}`}
                className={classes.parameterItem}
                p="md"
            >
              <Group justify="space-between" align="flex-start" w="100%">
                <Box style={{ flex: 1, maxWidth: "100%" }}>
                  <Text fw={500} mb="xs">{fullParam.parameter?.title}</Text>
                  {editingParam === fullParam.instance.blockParameterUuid ? (
                      fullParam.parameter?.dataType === 'text' ? (
                          <RichEditor
                              initialContent={editValue}
                              onContentChange={(contentHtml) => onStartEdit(
                                  fullParam.instance.blockParameterUuid,
                                  contentHtml
                              )}
                          />
                      ) : (
                          <TextInput
                              value={editValue}
                              onChange={(e) => onStartEdit(
                                  fullParam.instance.blockParameterUuid,
                                  e.currentTarget.value
                              )}
                              autoFocus
                          />
                      )
                  ) : (
                      <Text component="div" className={classes.contentWrapper}>
                        <div
                            dangerouslySetInnerHTML={{ __html: fullParam.instance.value || "Не указано" }}
                            className={classes.htmlContent}
                        />
                      </Text>
                  )}
                </Box>
                {editingParam === fullParam.instance.blockParameterUuid ? (
                    <ActionIcon
                        variant="subtle"
                        mt={4}
                        onClick={() => onSaveEdit(fullParam.instance)}
                    >
                      <IconCheck size={24} />
                    </ActionIcon>
                ) : (
                    <ActionIcon
                        variant="subtle"
                        mt={4}
                        onClick={() => onStartEdit(
                            fullParam.instance.blockParameterUuid,
                            fullParam.instance.value || ""
                        )}
                    >
                      <IconEdit size={24} />
                    </ActionIcon>
                )}
                <ActionIcon variant="subtle" color="red" mt={4}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Box>
        ))}
      </Stack>
  );
};
