import { Button, Space, Table } from "@mantine/core";
import { IBlockParameter } from "@/entities/ConstructorEntities";
import { ActionIcon } from "@mantine/core";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import React from "react";

interface IParamTableProps {
  params: IBlockParameter[];
  currentGroupUuid?: string;
  onAddParam: () => void;
  onEditParam: (param: IBlockParameter) => void;
}

export const ParamTable = ({
                             params,
                             currentGroupUuid,
                             onAddParam,
                             onEditParam,
                           }: IParamTableProps) => {
  return (
      <>
        <Space h="md" />
        <Button
            onClick={onAddParam}
            leftSection={<IconPlus size="1rem" />}
            size="xs"
            variant="light"
            compact
        >
          Добавить параметр
        </Button>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Название</Table.Th>
              <Table.Th>Тип данных</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {params?.map((param) => (
                <Table.Tr key={param.uuid}>
                  <Table.Td>{param.orderNumber}</Table.Td>
                  <Table.Td>{param.title}</Table.Td>
                  <Table.Td>{param.dataType}</Table.Td>
                  <Table.Td>
                    <ActionIcon onClick={() => onEditParam(param)}>
                      <IconEdit />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </>
  );
};
