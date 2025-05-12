import {Button, Group, Modal, Select, Stack, TextInput} from "@mantine/core";
import {useForm} from "@mantine/form";
import {IBlock, IBlockRelation, IBlockTab, IBlockTabKind} from "@/entities/ConstructorEntities";
import {useEffect} from "react";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

interface BlockTabEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<IBlockTab, 'id'>) => void;
  initialData?: IBlockTab;
  relations: IBlockRelation[];
  childBlocks: IBlock[];
  otherBlocks: IBlock[];
  currentBlockUuid: string;
}

export const BlockTabEditModal = ({
                                    isOpen,
                                    onClose,
                                    onSave,
                                    initialData,
                                    relations,
                                    childBlocks,
                                    otherBlocks,
                                    currentBlockUuid
                                  }: BlockTabEditModalProps) => {
  const {isMobile} = useMedia();
  const form = useForm<Omit<IBlockTab, 'id'>>({
    initialValues: {
      title: initialData?.title || '',
      tabKind: initialData?.tabKind || 'relation',
      relationUuid: initialData?.relationUuid || '',
      childBlockUuid: initialData?.childBlockUuid || '',
      orderNumber: initialData?.orderNumber || 0,
      blockUuid: initialData?.blockUuid || '',
      uuid: initialData?.uuid || '',
      isDefault: 0
    }
  });

  const handleSubmit = () => {
    onSave(form.values);
    onClose();
  };

  useEffect(() => {
    if (form.values.tabKind === 'relation' && form.values.relationUuid) {
      const relation = relations.find(r => r.uuid === form.values.relationUuid);
      const targetBlock = relation ?
          otherBlocks.find(b =>
              b.uuid === (relation.sourceBlockUuid === currentBlockUuid
                  ? relation.targetBlockUuid
                  : relation.sourceBlockUuid)
          ) :
          null;
      form.setFieldValue('title', targetBlock?.titleForms?.plural || '');
    }

    if (form.values.tabKind === 'childBlock' && form.values.childBlockUuid) {
      const childBlock = childBlocks.find(b => b.uuid === form.values.childBlockUuid);
      form.setFieldValue('title', childBlock?.titleForms?.plural || '');
    }
  }, [form.values.relationUuid, form.values.childBlockUuid]);

  return (
      <Modal
          opened={isOpen}
          onClose={onClose}
          title={initialData ? "Редактирование вкладки" : "Новая вкладка"}
          fullScreen={isMobile}
      >
        <Stack>
          <Select
              disabled={initialData?.isDefault === 1}
              label="Тип вкладки"
              data={[
                { value: IBlockTabKind.relation, label: 'Связи' },
                { value: IBlockTabKind.childBlock, label: 'Дочерние блоки' },
                { value: IBlockTabKind.parameters, label: 'Параметры' },
              ]}
              {...form.getInputProps('tabKind')}
          />

          {form.values.tabKind === 'relation' && (
              <Select
                  label="Связь"
                  data={relations.map(r => ({
                    value: r.uuid!,
                    label: `Связь с ${otherBlocks.find(b =>
                        b.uuid === (r.sourceBlockUuid === currentBlockUuid
                            ? r.targetBlockUuid
                            : r.sourceBlockUuid)
                    )?.title || 'Неизвестный блок'} (${r.relationType})`
                  }))}
                  {...form.getInputProps('relationUuid')}
              />
          )}

          {form.values.tabKind === 'childBlock' && (
              <Select
                  label="Дочерний блок"
                  data={childBlocks.map(b => ({
                    value: b.uuid!,
                    label: b.title
                  }))}
                  {...form.getInputProps('childBlockUuid')}
              />
          )}

          <TextInput
              label="Название вкладки"
              required
              {...form.getInputProps('title')}
          />

          <Group justify="flex-end">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSubmit}>Сохранить</Button>
          </Group>
        </Stack>
      </Modal>
  );
};
