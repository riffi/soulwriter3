import {Button, Group, Space, Table, Text, ActionIcon, Box, Badge} from "@mantine/core";
import {IBlockParameter, IBlockParameterDataTypeTitle} from "@/entities/ConstructorEntities";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import React from "react";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import classes from "./ParamTable.module.css"; // Создайте этот CSS модуль для кастомизации

interface IParamTableProps {
  params: IBlockParameter[];
  currentGroupUuid?: string;
  onAddParam: () => void;
  onEditParam: (param: IBlockParameter) => void;
  onDeleteParam: (paramId: number) => void;
}

export const ParamTable = ({
                             params,
                             currentGroupUuid,
                             onAddParam,
                             onEditParam,
                             onDeleteParam,
                           }: IParamTableProps) => {
  const { showDialog } = useDialog();

  return (
      <Box className={classes.container}>
        <Button
            onClick={onAddParam}
            leftSection={<IconPlus size="1rem" />}
            size="sm"
            variant="light"
            mb="md"
            className={classes.addButton}
        >
          Добавить параметр
        </Button>

        <Table striped highlightOnHover className={classes.table}>
          <Table.Thead style={{ fontSize: '0.7rem' }}>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th width={80}>Тип</Table.Th>
              <Table.Th width={100}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          {params?.length > 0 ? (
              <Table.Tbody>
                {params?.map((param) => (
                    <Table.Tr key={param.uuid}>
                      <Table.Td>
                        <div>
                          {param.title}
                        </div>
                        <Space h={5} />
                        <Group gap={4}>
                          {param.displayInCard? <Badge size="xs" color="green" variant="filled">В карточке</Badge> : ''}
                          {param.isDefault? <Badge size="xs" color="blue" variant="filled">По-умолчанию</Badge> : ''}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {IBlockParameterDataTypeTitle[param.dataType]}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="center">
                          <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => onEditParam(param)}
                          >
                            <IconEdit size="1rem" />
                          </ActionIcon>
                          <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={async () => {
                                const result = await showDialog("Вы уверены?", "Вы уверены, что хотите удалить параметр?")
                                if (result) {
                                  onDeleteParam(param.id!)
                                }
                              }}
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                ))}
              </Table.Tbody>
          ) : (
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center" py="md" size="sm">
                      Нет добавленных параметров
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
          )}
        </Table>
      </Box>
  );
};
