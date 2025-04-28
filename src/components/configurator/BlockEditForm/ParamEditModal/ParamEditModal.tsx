import {Button, Checkbox, Group, Modal, Select, TextInput} from "@mantine/core";
import { useForm } from '@mantine/form';
import {
  IBlockParameter, IBlockParameterDataType, IBlockParameterDataTypeTitle,
  IBlockStructureKind,
  IBlockStructureKindTitle
} from "@/entities/ConstructorEntities";
import {useEffect} from "react";
import {createOptionsFromEnums} from "@/utils/enumUtils";

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
      isDefault: 0,
      displayInCard: 0,
    }
  });

  const dataTypeOptions = createOptionsFromEnums(
      IBlockParameterDataType,
      IBlockParameterDataTypeTitle
  );

  return (
    <>
      <Modal
          title={props.initialData?.uuid ? 'Редактирование параметра' : 'Создание нового параметра'}
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
          <Select
            label="Тип данных"
            placeholder="Выберите тип данных"
            value={form.values.dataType}
            data={dataTypeOptions}
            {...form.getInputProps('dataType')}
            >
          </Select>
          <Checkbox
              mt="md"
              label="По умолчанию"
              checked={form.values.isDefault === 1}
              onChange={(e) => form.setFieldValue('isDefault', e.currentTarget.checked ? 1 : 0)}
          />
          <Checkbox
              mt="md"
              label="Отображать в карточке"
              checked={form.values.displayInCard === 1}
              onChange={(e) => form.setFieldValue('displayInCard', e.currentTarget.checked ? 1 : 0)}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Сохранить</Button>
          </Group>
        </form>
      </Modal>
    </>
  )
}
