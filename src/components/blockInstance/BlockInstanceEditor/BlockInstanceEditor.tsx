import { useNavigate } from "react-router-dom";
import { useBlockInstanceEditor } from "@/components/blockInstance/BlockInstanceEditor/useBlockInstanceEditor";
import {
  Button,
  Box,
  Group,
  Tabs,
  TextInput,
  Text,
  ActionIcon,
  Modal,
  Select,
  Stack,
  Textarea,
  Container,
  TypographyStylesProvider
} from "@mantine/core";
import { IconArrowLeft, IconEdit, IconPlus, IconTrash, IconCircleCheck, IconCheck } from "@tabler/icons-react";
import classes from "./BlockInstanceEditor.module.css";
import { useState, useEffect } from "react";
import { IBlockParameterGroup } from "@/entities/ConstructorEntities";
import { IBlockParameterInstance } from "@/entities/BookEntities";
import { bookDb } from "@/entities/bookDb";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";

export interface IBlockInstanceEditorProps {
  blockInstanceUuid: string;
}

export const BlockInstanceEditor = (props: IBlockInstanceEditorProps) => {
  const [currentParamGroup, setCurrentParamGroup] = useState<IBlockParameterGroup | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [parameterValue, setParameterValue] = useState("");
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const {
    blockInstance,
    parameterGroups,
    parameterInstances,
    availableParametersWithoutInstances,
    availableParameters
  } = useBlockInstanceEditor(props.blockInstanceUuid, currentParamGroup);

  const navigate = useNavigate();

  useEffect(() => {
    if (parameterGroups && parameterGroups.length > 0 && !currentParamGroup) {
      setCurrentParamGroup(parameterGroups[0]);
    }
  }, [parameterGroups, currentParamGroup]);

  const handleAddParameter = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveParameter = async () => {
    if (!selectedParameter || !props.blockInstanceUuid) return;

    const newInstance: IBlockParameterInstance = {
      blockParameterUuid: selectedParameter,
      blockInstanceUuid: props.blockInstanceUuid,
      blockParameterGroupUuid: currentParamGroup?.uuid || "",
      value: parameterValue
    };

    try {
      await bookDb.blockParameterInstances.add(newInstance);
      setIsAddModalOpen(false);
      setSelectedParameter(null);
      setParameterValue("");
    } catch (error) {
      console.error("Error saving parameter instance:", error);
    }
  };

  const fullParams = parameterInstances?.map((instance) => {
    return {
      parameter: availableParameters?.find((p) => p.uuid === instance.blockParameterUuid),
      instance
    }
  })

  const handleUpdateParameterValue = async (instance: IBlockParameterInstance, newValue: string) => {
    try {
      await bookDb.blockParameterInstances.update(instance.id, {
        ...instance,
        value: newValue
      });
    } catch (error) {
      console.error("Error updating parameter instance:", error);
    }
  };

  const handleStartEdit = (paramUuid: string, currentValue: string) => {
    setEditingParam(paramUuid);
    setEditValue(currentValue);
  };

  const handleSaveEdit = async (instance: IBlockParameterInstance) => {
    await handleUpdateParameterValue(instance, editValue);
    setEditingParam(null);
  };

  return (
      <>
        <Container>
          <Box className={classes.container} pos="relative">
            <Group mb="md" className={classes.header}>
              <ActionIcon
                  onClick={() => navigate(-1)}
                  variant="light"
                  size="lg"
                  aria-label="Back to list"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <TextInput
                  value={blockInstance?.title || ''}
                  placeholder="Instance title"
                  size="md"
                  className={classes.titleInput}
              />
            </Group>

            <Tabs
                className={classes.tabs}
                value={currentParamGroup?.uuid}
                onChange={(value) => {
                  const group = parameterGroups?.find((g) => g.uuid === value);
                  if (group) setCurrentParamGroup(group);
                }}
            >
              <Tabs.List className={classes.tabList}>
                {parameterGroups?.map((group) => (
                    <Tabs.Tab key={group.uuid || `group-${group.title}`} value={group.uuid} className={classes.tab}>
                      {group.title}
                    </Tabs.Tab>
                ))}
              </Tabs.List>

              <>
                {parameterGroups?.map((group) =>
                    <Tabs.Panel key={group.uuid || `panel-${group.title}`} value={group.uuid} pt="md">
                      <Box className={classes.panelContent}>
                        <Button
                            onClick={handleAddParameter}
                            leftSection={<IconPlus size="1rem" />}
                            size="sm"
                            variant="light"
                            mb="md"
                            className={classes.addButton}
                            disabled={!availableParametersWithoutInstances?.length}
                        >
                          Добавить параметр
                        </Button>

                        <Stack gap="sm" className={classes.parametersStack}>
                          {parameterInstances && parameterInstances.length > 0 &&
                              fullParams?.map((fullParam, index) => (
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
                                                    onContentChange={(contentHtml, contentText) => setEditValue(contentHtml)}
                                                />
                                            ) : (
                                                <TextInput
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.currentTarget.value)}
                                                    autoFocus
                                                />
                                            )
                                        ) : (
                                            <Text component="div" className={classes.contentWrapper}>
                                              <TypographyStylesProvider>
                                                <div
                                                    dangerouslySetInnerHTML={{ __html: fullParam.instance.value || "Не указано" }}
                                                    className={classes.htmlContent}
                                                />
                                              </TypographyStylesProvider>
                                            </Text>
                                        )}
                                      </Box>
                                      {editingParam === fullParam.instance.blockParameterUuid ? (
                                          <ActionIcon
                                              variant="subtle"
                                              mt={4}
                                              onClick={() => handleSaveEdit(fullParam.instance)}
                                          >
                                            <IconCheck size={24} />
                                          </ActionIcon>
                                      ) : (
                                          <ActionIcon
                                              variant="subtle"
                                              mt={4}
                                              onClick={() => handleStartEdit(
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
                              ))
                          }
                        </Stack>
                      </Box>
                    </Tabs.Panel>
                )}
              </>
            </Tabs>
          </Box>
        </Container>
        <Modal
            opened={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Добавить параметр"
            centered
        >
          <Stack>
            <Select
                label="Выберите параметр"
                placeholder="Выберите параметр"
                data={availableParametersWithoutInstances?.map(param => ({
                  value: param.uuid || '',
                  label: param.title
                })) || []}
                value={selectedParameter}
                onChange={setSelectedParameter}
            />

            <Textarea
                label="Значение параметра"
                placeholder="Введите значение"
                value={parameterValue}
                onChange={(e) => setParameterValue(e.currentTarget.value)}
                autosize
                minRows={3}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveParameter} disabled={!selectedParameter}>
                Сохранить
              </Button>
            </Group>
          </Stack>
        </Modal>
      </>
  );
};
