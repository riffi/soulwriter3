import { Group, Badge, ActionIcon, Text, Table } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { IBlockInstance } from '@/entities/BookEntities';
import {IBlockParameter} from "@/entities/ConstructorEntities";
import {
  IBlockInstanceWithParams
} from "@/components/blockInstance/BlockInstanceManager/useBlockInstanceManager";

interface BlockInstanceTableRowProps {
  instance: IBlockInstanceWithParams;
  displayedParameters?: IBlockParameter[];
  onEdit: (uuid: string) => void;
  onDelete: (instance: IBlockInstance) => void;
}

export const BlockInstanceTableRow = ({
                                        instance,
                                        displayedParameters,
                                        onEdit,
                                        onDelete,
                                      }: BlockInstanceTableRowProps) => {
  return (
      <Table.Tr key={instance.uuid}>
        <Table.Td>
          <div>
            <Text fw={500}>{instance.title}</Text>
            <Group gap="xs" mt={4}>
              {displayedParameters?.map((param) => {
                const paramInstance = instance.params?.find(
                    (p) => p.blockParameterUuid === param.uuid
                );
                return (
                    <Badge
                        key={param.uuid}
                        variant="light"
                        color="grey"
                        radius="sm"
                        style={{fontSize: '0.8rem', textTransform: 'lowercase', fontWeight: 400}}
                    >
                      {param.title}:{' '}
                      {param.dataType === 'text'
                          ? paramInstance?.value?.replace(/<[^>]*>/g, '') || '—'
                          : paramInstance?.value || '—'}
                    </Badge>
                );
              })}
            </Group>
          </div>
        </Table.Td>
        <Table.Td>
          <Group gap={4} justify="center">
            <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => onEdit(instance.uuid!)}
            >
              <IconEdit size="1rem" />
            </ActionIcon>
            <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => onDelete(instance)}
            >
              <IconTrash size="1rem" />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
  );
};
