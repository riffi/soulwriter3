import { useForm } from "@mantine/form";
import { Modal, Select, Button, Group } from "@mantine/core";
import {BlockRelationType, IBlock, IBlockRelation} from "@/entities/ConstructorEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

interface RelationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (relation: IBlockRelation) => void;
  initialData?: IBlockRelation;
  blockUuid: string;
  otherBlocks: IBlock[];
}

export const RelationEditModal = ({
                                    isOpen,
                                    onClose,
                                    onSave,
                                    initialData,
                                    blockUuid,
                                    otherBlocks
                                  }: RelationEditModalProps) => {
  const {isMobile} = useMedia();
  const blocks = otherBlocks;

  const form = useForm<IBlockRelation>({
    initialValues: initialData || {
      sourceBlockUuid: blockUuid,
      targetBlockUuid: '',
      relationType: BlockRelationType.ONE_TO_ONE,
      configurationUuid: ''
    }
  });

  return (
      <Modal
          opened={isOpen}
          onClose={onClose}
          title={initialData ? "Редактирование связи" : "Новая связь"}
          fullScreen={isMobile}
      >
        <form onSubmit={form.onSubmit(onSave)}>
          <Select
              label="Целевой блок"
              data={blocks?.filter(b => b.uuid !== blockUuid).map(b => ({
                value: b.uuid!,
                label: b.title
              })) || []}
              {...form.getInputProps('targetBlockUuid')}
              required
          />

          <Select
              label="Тип связи"
              data={Object.values(BlockRelationType).map(t => ({
                value: t,
                label: t
              }))}
              {...form.getInputProps('relationType')}
              mt="md"
              required
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </Group>
        </form>
      </Modal>
  );
};
