import { useNavigate } from "react-router-dom";
import { useBlockInstanceEditor } from "@/components/blockInstance/BlockInstanceEditor/hooks/useBlockInstanceEditor";
import {
  Button,
  Box,
  Group,
  Tabs,
  TextInput,
  ActionIcon,
  Modal,
  Select,
  Stack,
  Textarea,
  Container,
} from "@mantine/core";
import { IconArrowLeft, IconPlus} from "@tabler/icons-react";
import classes from "./BlockInstanceEditor.module.css";
import { useState, useEffect } from "react";
import { IBlockParameterGroup } from "@/entities/ConstructorEntities";
import { IBlockParameterInstance } from "@/entities/BookEntities";
import { bookDb } from "@/entities/bookDb";
import {
  ParameterList
} from "@/components/blockInstance/BlockInstanceEditor/components/ParameterList";
import {FullParam} from "@/components/blockInstance/BlockInstanceEditor/types";

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
    block,
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

  const fullParams: FullParam[] = parameterInstances?.map((instance) => {
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

  const groupContent = (
    <>
    <Box className={classes.panelContent}>
      <>
      {availableParametersWithoutInstances?.length > 0 &&
        <Button
            onClick={handleAddParameter}
            leftSection={<IconPlus size="1rem" />}
            size="sm"
            variant="light"
            mb="md"
            className={classes.addButton}
            hidden={availableParametersWithoutInstances?.length === 0}
        >
          Добавить параметр
        </Button>
      }
      </>

      <ParameterList
          fullParams={fullParams}
          editingParam={editingParam}
          editValue={editValue}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
      />
    </Box>
    </>
  )

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
            <>
            {block?.useTabs &&
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
                        {groupContent}
                      </Tabs.Panel>
                    )}
                  </>
              </Tabs>
            }
            {!block?.useTabs && groupContent}
            </>
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
