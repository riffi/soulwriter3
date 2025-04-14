import {Button, Group, Modal, SegmentedControl, TextInput} from "@mantine/core";
import { useForm } from '@mantine/form';
import {
  IBlock,
  IBlockStructureKind,
  IBlockStructureKindTitle
} from "@/entities/ConstructorEntities";

interface IBlockEditModalProps {
  configurationUuid: string
  isOpen: boolean
  onClose: () => void
  onSave: (data: IBlock) => void
  initialData?: IBlock
}

const structureKindOptions = [
  { value: IBlockStructureKind.single, label: IBlockStructureKindTitle.single },
  { value: IBlockStructureKind.multiple, label: IBlockStructureKindTitle.multiple },
  { value: IBlockStructureKind.tree, label: IBlockStructureKindTitle.tree },
];
export const BlockEditModal  = (props: IBlockEditModalProps) => {

  const form = useForm({
    mode: 'controlled',
    initialValues: props.initialData
  })

  return (
    <>
      <Modal
          title={props.initialData?.uuid ? 'Редактирование блока' : 'Создание нового блока'}
          opened={props.isOpen}
          onClose={props.onClose}
      >
        <form onSubmit={
          form.onSubmit((values) => {
            props.onSave(values)
            props.onClose()
          })
        }>
          <TextInput
            withAsterisk
            label="Название"
            key={form.key('title')}
            {...form.getInputProps('title')}
          />
          <TextInput
              label="Описание"
              key={form.key('description')}
              {...form.getInputProps('description')}
          />
          <SegmentedControl
              fullWidth
              mt="md"
              data={structureKindOptions}
              key={form.key('structureKind')}
              {...form.getInputProps('structureKind')}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Сохранить</Button>
          </Group>
        </form>
      </Modal>
    </>
  )
}
