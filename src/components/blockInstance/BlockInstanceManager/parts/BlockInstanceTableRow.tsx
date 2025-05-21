import { Group, Badge, ActionIcon, Text, Table } from '@mantine/core';
import { IconEdit, IconTrash, IconDots } from '@tabler/icons-react';
import { IBlockInstance } from '@/entities/BookEntities';
import {IBlockParameter} from "@/entities/ConstructorEntities";
import {
  IBlockInstanceWithParams
} from "@/components/blockInstance/BlockInstanceManager/useBlockInstanceManager";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { Drawer, Button, Stack } from '@mantine/core';
import { useState } from 'react';

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
        <Table.Td>
          <div>
            <Text
                fw={400}
                onClick={() => onEdit(instance.uuid!)}
                style={{cursor: 'pointer'}}
            >
              {instance.title}
            </Text>
              {instance.shortDescription && (
                  <Text size="xs" c="dimmed" mt={2}>
                      {instance.shortDescription}
                  </Text>
              )}
            <Group gap="xs" mt={4}>
              {displayedParameters?.map((param) => {
                const paramInstance = instance.params?.find(
                    (p) => p.blockParameterUuid === param.uuid
                );
                return (
                    <Badge
                        key={param.uuid}
                        variant="outline"
                        color="#999999"
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
