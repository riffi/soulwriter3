import { Group, Badge, ActionIcon, Text, Table, Drawer, Button, Stack } from '@mantine/core';
import { IconEdit, IconTrash, IconDots } from '@tabler/icons-react';
import { IBlockInstance } from '@/entities/BookEntities';
import {IBlock, IBlockParameter} from "@/entities/ConstructorEntities";
import {
  IBlockInstanceWithParams
} from "@/components/blockInstance/BlockInstanceManager/useBlockInstanceManager";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { useState } from 'react';
import {
  ParameterViewVariantRenderer
} from "@/components/shared/blockParameter/ParameterViewVariantRenderer/ParameterViewVariantRenderer";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";

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
  const {isMobile} = useMedia();
  const [openedDrawerId, setOpenedDrawerId] = useState<string | null>(null);

  const handleDrawerActions = (action: 'edit' | 'delete') => {
    setOpenedDrawerId(null);
    switch(action) {
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
          <Group gap="10">
            <IconViewer
                iconName={block?.icon}
                customIconBase64={block?.customIconBase64}
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
          <Group gap={4} justify="center">
            {isMobile ? (
                <>
                  <ActionIcon
                      variant="subtle"
                      onClick={() => setOpenedDrawerId(instance.uuid!)}
                  >
                    <IconDots size={16} />
                  </ActionIcon>

                  <Drawer
                      opened={openedDrawerId === instance.uuid}
                      onClose={() => setOpenedDrawerId(null)}
                      position="bottom"
                      title="Действия"
                      size="25%"
                  >
                    <Stack gap="sm">
                      <Button
                          variant="subtle"
                          leftSection={<IconEdit size={16} />}
                          onClick={() => handleDrawerActions('edit')}
                      >
                        Редактировать
                      </Button>
                      <Button
                          color="red"
                          variant="subtle"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => handleDrawerActions('delete')}
                      >
                        Удалить
                      </Button>
                    </Stack>
                  </Drawer>
                </>
            ) : (
                <>
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
                </>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
  );
};
