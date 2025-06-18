import React from 'react';
import {Modal, TextInput, Button, Tabs, ScrollArea, Stack, Text} from '@mantine/core';
import {useLiveQuery} from 'dexie-react-hooks';
import {bookDb} from '@/entities/bookDb';
import {IBlock} from '@/entities/ConstructorEntities';
import {IBlockInstance, IBlockInstanceGroup} from '@/entities/BookEntities';
import {BlockInstanceGroupRepository} from '@/repository/BlockInstance/BlockInstanceGroupRepository';

interface SceneLinkManagerModalProps {
  opened: boolean;
  onClose: () => void;
  block: IBlock;
  availableInstances: IBlockInstance[];
  linkTitle: string;
  onLinkTitleChange: (t: string) => void;
  onSelectInstance: (uuid: string) => void;
}

export const SceneLinkManagerModal = ({
  opened,
  onClose,
  block,
  availableInstances,
  linkTitle,
  onLinkTitleChange,
  onSelectInstance,
}: SceneLinkManagerModalProps) => {
  const groups = useLiveQuery<IBlockInstanceGroup[]>(() => {
    if (block.useGroups !== 1) return Promise.resolve([]);
    return BlockInstanceGroupRepository.getGroups(bookDb, block.uuid!);
  }, [block]);

  const renderInstances = (instances: IBlockInstance[]) => (
    <Stack>
      {instances.map(inst => (
        <Button key={inst.uuid} variant="light" onClick={() => onSelectInstance(inst.uuid)}>
          {inst.title}
        </Button>
      ))}
    </Stack>
  );

  const groupedContent = () => (
    <Tabs defaultValue="none">
      <Tabs.List>
        <Tabs.Tab value="none">Без групп</Tabs.Tab>
        {groups?.map(g => (
          <Tabs.Tab key={g.uuid} value={g.uuid}>{g.title}</Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panel value="none" pt="xs">
        <ScrollArea h={300}>{renderInstances(availableInstances.filter(i => !i.blockInstanceGroupUuid))}</ScrollArea>
      </Tabs.Panel>
      {groups?.map(g => (
        <Tabs.Panel key={g.uuid} value={g.uuid} pt="xs">
          <ScrollArea h={300}>{renderInstances(availableInstances.filter(i => i.blockInstanceGroupUuid === g.uuid))}</ScrollArea>
        </Tabs.Panel>
      ))}
    </Tabs>
  );

  const plainContent = () => (
    <ScrollArea h={300}>{renderInstances(availableInstances)}</ScrollArea>
  );

  return (
    <Modal opened={opened} onClose={onClose} title={`Выберите ${block.titleForms?.accusative}`} size="lg">
      <Stack>
        <TextInput
          label="Название связи"
          placeholder="Введите название связи"
          value={linkTitle}
          onChange={(e) => onLinkTitleChange(e.currentTarget.value)}
        />
        {availableInstances.length > 0 ? (
          block.useGroups === 1 ? groupedContent() : plainContent()
        ) : (
          <Text c="dimmed" ta="center" py="md">
            Все элементы уже привязаны
          </Text>
        )}
      </Stack>
    </Modal>
  );
};

export default SceneLinkManagerModal;
