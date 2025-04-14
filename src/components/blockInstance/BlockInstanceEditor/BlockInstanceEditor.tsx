import { useNavigate } from "react-router-dom";
import { useBlockInstanceEditor } from "@/components/blockInstance/BlockInstanceEditor/useBlockInstanceEditor";
import {
  Button,
  Box,
  Group,
  Tabs,
  TextInput,
  Table,
  Text,
  ActionIcon,
  LoadingOverlay
} from "@mantine/core";
import { IconArrowLeft, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import classes from "./BlockInstanceEditor.module.css";
import { useState, useEffect } from "react";
import {IBlockParameterDataType, IBlockParameterGroup} from "@/entities/ConstructorEntities"; // Добавлены импорты

export interface IBlockInstanceEditorProps {
  blockInstanceUuid: string;
}

export const BlockInstanceEditor = (props: IBlockInstanceEditorProps) => {
  const [currentParamGroup, setCurrentParamGroup] = useState<IBlockParameterGroup| null>(null);

  const {
    blockInstance,
    parameterGroups,
  } = useBlockInstanceEditor(props.blockInstanceUuid, currentParamGroup);

  const navigate = useNavigate();

  // Устанавливаем первую вкладку активной при загрузке parameterGroups
  useEffect(() => {
    if (parameterGroups && parameterGroups.length > 0 && !currentParamGroup) {
      setCurrentParamGroup(parameterGroups[0])
      //setActiveTab(parameterGroups[0].uuid!);
    }
  }, [parameterGroups]);

  return (
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
              // onChange={handleTitleChange}
              placeholder="Instance title"
              size="md"
              className={classes.titleInput}
          />
        </Group>

        <Tabs
            className={classes.tabs}
            value={currentParamGroup?.uuid}
            onChange={(value) => setCurrentParamGroup(parameterGroups?.find((g) => g.uuid === value))}>
          <Tabs.List className={classes.tabList}>
            {parameterGroups?.map((group) => (
                <Tabs.Tab key={group.uuid} value={group.uuid!} className={classes.tab}>
                  {group.title}
                </Tabs.Tab>
            ))}
          </Tabs.List>

          {parameterGroups?.map((group) => (
              <Tabs.Panel key={group.uuid} value={group.uuid!} pt="md">
                <Box className={classes.panelContent}>
                  <Button
                      // onClick={() => handleAddParameter(group.uuid!)}
                      leftSection={<IconPlus size="1rem" />}
                      size="sm"
                      variant="light"
                      mb="md"
                      className={classes.addButton}
                  >
                    Добавить параметр
                  </Button>

                  <Table striped highlightOnHover className={classes.table}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th width={50}>#</Table.Th>
                        <Table.Th>Название</Table.Th>
                        <Table.Th width={150}>Тип данных</Table.Th>
                        <Table.Th width={100}>Действия</Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text c="dimmed" ta="center" py="md" size="sm">
                            Нет параметров в этой группе
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Box>
              </Tabs.Panel>
          ))}
        </Tabs>
      </Box>
  );
};
