import {Modal, Group, Button, ActionIcon, TextInput, Flex} from "@mantine/core";
import {IconPlus, IconArrowUp, IconArrowDown, IconTrash} from "@tabler/icons-react";
import {useState} from "react";
import {notifications} from "@mantine/notifications";
import {IBlockInstanceGroup} from "@/entities/BookEntities";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

interface InstanceGroupsModalProps {
  opened: boolean;
  onClose: () => void;
  groups: IBlockInstanceGroup[];
  onSaveGroup: (title: string) => void;
  onMoveGroupUp: (uuid: string) => void;
  onMoveGroupDown: (uuid: string) => void;
  onDeleteGroup: (uuid: string) => void;
  onUpdateGroupTitle: (uuid: string, title: string) => void;
}

export const InstanceGroupsModal = ({
  opened,
  onClose,
  groups,
  onSaveGroup,
  onMoveGroupUp,
  onMoveGroupDown,
  onDeleteGroup,
  onUpdateGroupTitle,
}: InstanceGroupsModalProps) => {
  const [newTitle, setNewTitle] = useState('');
  const {isMobile} = useMedia();

  const handleSave = () => {
    if (!newTitle.trim()) {
      notifications.show({title: 'Ошибка', message: 'Название группы не может быть пустым', color: 'red'});
      return;
    }
    onSaveGroup(newTitle);
    setNewTitle('');
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Управление группами" size="lg" fullScreen={isMobile}>
      <Flex justify="flex-start" align="self-end" mb="md" gap="md">
        <TextInput label="Название новой группы" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} placeholder="Введите название" required />
        <Button onClick={handleSave} leftSection={<IconPlus size="1rem"/>}>Добавить</Button>
      </Flex>
      {groups?.map((g, index) => (
        <Group key={g.uuid} mb="xs" grow>
          <InlineEdit value={g.title} onChange={(t)=>onUpdateGroupTitle(g.uuid, t)} placeholder="Название группы" inputProps={{style:{flex:1}}}/>
          <Group gap={5}>
            <ActionIcon variant="light" onClick={()=>onMoveGroupUp(g.uuid)} disabled={index===0}><IconArrowUp size="1rem"/></ActionIcon>
            <ActionIcon variant="light" onClick={()=>onMoveGroupDown(g.uuid)} disabled={index===groups.length-1}><IconArrowDown size="1rem"/></ActionIcon>
            <ActionIcon variant="light" color="red" onClick={()=>onDeleteGroup(g.uuid)} disabled={groups.length<=1}><IconTrash size="1rem"/></ActionIcon>
          </Group>
        </Group>
      ))}
    </Modal>
  );
};
