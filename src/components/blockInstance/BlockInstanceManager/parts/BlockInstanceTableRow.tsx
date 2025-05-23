import { Group, Badge, Text, Table, Stack } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { IBlockInstance } from '@/entities/BookEntities';
import {IBlock, IBlockParameter} from "@/entities/ConstructorEntities";
import {
  IBlockInstanceWithParams
} from "@/components/blockInstance/BlockInstanceManager/useBlockInstanceManager";
import {
  ParameterViewVariantRenderer
} from "@/components/shared/blockParameter/ParameterViewVariantRenderer/ParameterViewVariantRenderer";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";
import {RowActionButtons, ActionItem} from "@/components/shared/RowActionButtons/RowActionButtons";

interface BlockInstanceTableRowProps {
  instance: IBlockInstanceWithParams;
  block: IBlock;
  displayedParameters?: IBlockParameter[];
  onEdit: (uuid: string) => void;
  onDelete: (instance: IBlockInstance) => void;
}

export const BlockInstanceTableRow = ({
                                        instance,
                                        block,
                                        displayedParameters,
                                        onEdit,
                                        onDelete,
                                      }: BlockInstanceTableRowProps) => {

  const actions: ActionItem[] = [
    {
      key: 'edit',
      title: 'Редактировать',
      icon: <IconEdit/>,
      color: 'blue'
    },
    {
      key: 'delete',
      title: 'Удалить',
      icon: <IconTrash/>,
      color: 'red'
    }
  ];

  const handleAction = (actionKey: string) => {
    switch(actionKey) {
      case 'edit':
        onEdit(instance.uuid!);
        break;
      case 'delete':
        onDelete(instance);
        break;
    }
  };

  return (
      <Table.Tr key={instance.uuid}>
        <Table.Td
            onClick={() => onEdit(instance.uuid!)}
            style={{cursor: 'pointer', padding: '10px 0px 10px 20px'}}
        >
          <Group gap="10" wrap="nowrap">
            <IconViewer
                icon={instance?.icon ?? block?.icon}
                size={35}
                color="rgb(102, 102, 102)"
                backgroundColor="transparent"
                style={{
                  paddingLeft: 0
                }}
            />
            <Stack gap={0}>
              <Text
                  style={{cursor: 'pointer', fontSize: '1.1rem', lineHeight: '1.5rem'}}
              >
                {instance.title}
              </Text>
              {instance.shortDescription && (
                  <Text size="sm" c="dimmed" mt={0}>
                    {instance.shortDescription}
                  </Text>
              )}
            </Stack>
          </Group>
          <Group
              gap="0"
              style={{
                marginTop: '5px'
              }}
          >
            {displayedParameters?.map((param, index) => {
              const paramInstance = instance.params?.find(
                  (p) => p.blockParameterUuid === param.uuid
              );
              return (
                  <Badge
                      key={param.uuid}
                      variant="transparent"
                      color="#BBB"
                      style={{
                        fontSize: '0.8rem',
                        textTransform: 'lowercase',
                        fontWeight: 400,
                        paddingLeft: '0px',
                        borderRadius: '0'
                      }}
                  >
                    <Group gap={5} style={{
                      borderRight: index < displayedParameters?.length - 1 ? '1px solid #EEE' : 'none',
                      paddingRight: '10px',
                    }}>
                      <Text
                          size={12}
                      >
                        {param.title}:{' '}
                      </Text>

                      <ParameterViewVariantRenderer dataType={param.dataType} value={paramInstance?.value || ''} />
                    </Group>
                  </Badge>
              );
            })}
          </Group>
        </Table.Td>
        <Table.Td>
          <RowActionButtons
              actions={actions}
              onAction={handleAction}
              entityId={instance.uuid}
              drawerTitle="Действия"
          />
        </Table.Td>
      </Table.Tr>
  );
};
