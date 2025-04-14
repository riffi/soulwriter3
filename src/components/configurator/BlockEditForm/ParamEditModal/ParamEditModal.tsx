import {Button, Group, Modal, Select, TextInput} from "@mantine/core";
import { useForm } from '@mantine/form';
import {IBlockParameter} from "@/entities/ConstructorEntities";
import {useEffect} from "react";

interface IBlockEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: IBlockParameter) => void
  initialData?: IBlockParameter
}
export const ParamEditModal  = (props: IBlockEditModalProps) => {

  const form = useForm<IBlockParameter>({
    mode: 'controlled',
    initialValues: props.initialData || {
      uuid: "",
      title: "",
      description: "",
      groupUuid: "",
      dataType: "string",
      orderNumber: 0,
    }
  });


  return (
    <>
      <Modal
          title={props.initialData?.uuid ? 'Редактирование параметра' : 'Создание нового параметра'}
          opened={props.isOpen}
          onClose={props.onClose}
      >
        <form onSubmit={
          form.onSubmit((values) => {
            console.log("Начало сохранения")
            props.onSave(values)
            props.onClose()
            console.log("Завершение сохранения")
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
          <Select
            label="Тип данных"
            placeholder="Выберите тип данных"
            value={form.values.dataType}
            data={[
                { value: 'string', label: 'Строка' },
                { value: 'text', label: 'Текст' },
            ]}
            {...form.getInputProps('dataType')}
            >
          </Select>
          <Group justify="flex-end" mt="md">
            <Button type="submit">Сохранить</Button>
          </Group>
        </form>
      </Modal>
    </>
  )
}
