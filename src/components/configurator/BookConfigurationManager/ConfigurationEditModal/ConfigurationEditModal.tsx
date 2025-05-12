import {Button, Group, Modal, TextInput} from "@mantine/core";
import { useForm } from '@mantine/form';
import {IBookConfiguration} from "@/entities/ConstructorEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

interface IConfigurationEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: IBookConfiguration) => void
  initialData?: IBookConfiguration
}
export const ConfigurationEditModal  = (props: IConfigurationEditModalProps) => {

  const {isMobile} = useMedia();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: props.initialData
  })

  return (
    <>
      <Modal
          title={props.initialData?.uuid ? 'Редактирование конфигурации' : 'Создание новой конфигурации'}
          opened={props.isOpen}
          onClose={props.onClose}
          fullScreen={isMobile}
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
          <Group justify="flex-end" mt="md">
            <Button type="submit">Сохранить</Button>
          </Group>
        </form>
      </Modal>
    </>
  )
}
