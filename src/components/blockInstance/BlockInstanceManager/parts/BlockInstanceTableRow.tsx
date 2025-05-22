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
            style={{cursor: 'pointer'}}
        >
          <Group gap="10">
            <IconViewer
                iconName={block?.icon}
                size={25}
                color="rgb(102, 102, 102)"
                backgroundColor="transparent"
            />
            <Stack gap={0}>
              <Text
                  style={{cursor: 'pointer', fontSize: '0.9rem',}}
              >
                {instance.title}
              </Text>
                {instance.shortDescription && (
                    <Text size="xs" c="dimmed" mt={2}>
                        {instance.shortDescription}
                    </Text>
                )}
            </Stack>
          </Group>
          <Group
              gap="0"
              mt={10}
              style={{
                  borderLeft: '3px solid rgb(182 206 233)',
              }}
          >
            {displayedParameters?.map((param) => {
              const paramInstance = instance.params?.find(
                  (p) => p.blockParameterUuid === param.uuid
              );
              return (
                  <Badge
                      key={param.uuid}
                      variant="transparent"
                      color="#AAA"
                      radius="sm"
                      style={{
                        fontSize: '0.8rem',
                        textTransform: 'lowercase',
                        fontWeight: 400,
                        paddingLeft: '5px',
                      }}
                  >
                    <Group gap={5}>
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
