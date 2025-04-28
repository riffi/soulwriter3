import {Button, Checkbox, Group, Modal, Select, TextInput, Stack, ActionIcon, Text} from "@mantine/core";
import { useForm } from '@mantine/form';
import {
  IBlockParameter, IBlockParameterDataType, IBlockParameterDataTypeTitle,
  IBlockStructureKind,
  IBlockStructureKindTitle
} from "@/entities/ConstructorEntities";
import {useEffect, useState} from "react";
import {createOptionsFromEnums} from "@/utils/enumUtils";
import {IconTrash} from "@tabler/icons-react";
import {useBlockEditForm} from "@/components/configurator/BlockEditForm/useBlockEditForm";

interface IBlockEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: IBlockParameter) => void
  blockUuid?: string
  bookUuid?: string
  initialData?: IBlockParameter,
}

export const ParamEditModal  = (props: IBlockEditModalProps) => {
  const [possibleValues, setPossibleValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState('');
  const { loadPossibleValues, savePossibleValues } = useBlockEditForm(props.blockUuid, props.bookUuid);

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

  useEffect(() => {
    const loadValues = async () => {
      if (props.initialData?.uuid && form.values.dataType === 'dropdown') {
        const values = await loadPossibleValues(props.initialData.uuid);
        setPossibleValues(values.map(v => v.value));
      }
    };
    loadValues();
  }, [props.initialData?.uuid, form.values.dataType]);

  const dataTypeOptions = createOptionsFromEnums(
      IBlockParameterDataType,
      IBlockParameterDataTypeTitle
  );

  const handleAddValue = () => {
    if (newValue.trim()) {
      setPossibleValues(prev => [...prev, newValue.trim()]);
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setPossibleValues(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: IBlockParameter) => {
    // Сохраняем параметр
    props.onSave(values);

    // Сохраняем значения только после успешного сохранения параметра
    if (values.dataType === 'dropdown' && values.uuid) {
      await savePossibleValues(values.uuid, possibleValues);
    }
  };

  return (
      <Modal
          title={props.initialData?.uuid ? 'Редактирование параметра' : 'Создание нового параметра'}
          opened={props.isOpen}
          onClose={props.onClose}
          size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
                withAsterisk
                label="Название"
                {...form.getInputProps('title')}
            />

            <TextInput
                label="Описание"
                {...form.getInputProps('description')}
            />

            <Select
                label="Тип данных"
                data={dataTypeOptions}
                {...form.getInputProps('dataType')}
            />

            {form.values.dataType === 'dropdown' && (
                <div>
                  <Text size="sm" fw={500} mb={3}>Возможные значения</Text>
                  <Stack gap="xs">
                    {possibleValues.map((value, index) => (
                        <Group key={index} gap="xs">
                          <TextInput
                              value={value}
                              style={{flex: 1}}
                              onChange={(e) => setPossibleValues(prev =>
                                  prev.map((v, i) => i === index ? e.target.value : v)
                              )}
                          />
                          <ActionIcon
                              color="red"
                              onClick={() => handleRemoveValue(index)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                    ))}
                    <Group gap="xs">
                      <TextInput
                          placeholder="Добавить значение"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          style={{flex: 1}}
                      />
                      <Button onClick={handleAddValue}>Добавить</Button>
                    </Group>
                  </Stack>
                </div>
            )}

            <Checkbox
                label="По умолчанию"
                checked={form.values.isDefault === 1}
                onChange={(e) => form.setFieldValue('isDefault', e.currentTarget.checked ? 1 : 0)}
            />

            <Checkbox
                label="Отображать в карточке"
                checked={form.values.displayInCard === 1}
                onChange={(e) => form.setFieldValue('displayInCard', e.currentTarget.checked ? 1 : 0)}
            />

            <Group justify="flex-end" mt="md">
              <Button type="submit">Сохранить</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
  )
}
