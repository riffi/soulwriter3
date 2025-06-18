import {Button, Group, Modal, SegmentedControl, TextInput, Text, SimpleGrid, Title, Alert} from "@mantine/core";
import { useForm } from '@mantine/form';
import React, {useState, useEffect} from "react";
import {
  IBlock,
  IBlockStructureKind,
  IBlockStructureKindTitle,
  IBlockTitleForms
} from "@/entities/ConstructorEntities";
import {createOptionsFromEnums} from "@/utils/enumUtils";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { InkLuminApiError } from "@/api/inkLuminMlApi";

interface IBlockEditModalProps {
  configurationUuid: string;
  isOpen: boolean;
  onClose: () => void;
  // onSave now needs to be async to handle potential API errors and return a status or throw
  onSave: (data: IBlock, titleForms?: IBlockTitleForms) => Promise<void>;
  initialData?: IBlock;
}


const structureKindOptions = createOptionsFromEnums(IBlockStructureKind, IBlockStructureKindTitle);

const defaultTitleForms: IBlockTitleForms = {
  nominative: '', genitive: '', dative: '', accusative: '',
  instrumental: '', prepositional: '', plural: ''
};

export const BlockEditModal  = (props: IBlockEditModalProps) => {

  const {isMobile} = useMedia();
  const [showApiErrorFields, setShowApiErrorFields] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [modalTitleForms, setModalTitleForms] = useState<IBlockTitleForms>(
      props.initialData?.titleForms || { ...defaultTitleForms, nominative: props.initialData?.title || '' }
  );

  const form = useForm<IBlock>({
    mode: 'controlled',
    initialValues: props.initialData || {
      title: '',
      description: '',
      structureKind: IBlockStructureKind.single,
      configurationUuid: props.configurationUuid,
      // Ensure all required IBlock fields are initialized if not in initialData
      useTabs: 0,
      useGroups: 0,
      displayKind: 'list',
      sceneLinkAllowed: 0,
      showInSceneList: 0,
    } as IBlock, // Cast needed if initialValues doesn't satisfy IBlock fully
    validate: {
      title: (value) => (value.trim().length > 0 ? null : 'Название не может быть пустым'),
    },
  });

  useEffect(() => {
    if (props.isOpen) {
      form.setValues(props.initialData || {
        title: '',
        description: '',
        structureKind: IBlockStructureKind.single,
        configurationUuid: props.configurationUuid,
        useTabs: 0, useGroups: 0, displayKind: 'list', sceneLinkAllowed: 0, showInSceneList: 0,
      } as IBlock);
      setModalTitleForms(props.initialData?.titleForms || { ...defaultTitleForms, nominative: props.initialData?.title || form.values.title || '' });
      setShowApiErrorFields(false);
      setApiErrorMessage(null);
    }
  }, [props.isOpen, props.initialData]);

  useEffect(() => {
    // If form title changes and error fields are not shown (i.e., not in manual override mode)
    // update nominative case of modalTitleForms
    if (!showApiErrorFields) {
      setModalTitleForms(prev => ({...(prev || defaultTitleForms), nominative: form.values.title || ''}));
    }
  }, [form.values.title, showApiErrorFields]);


  const handleFormSubmit = async (values: IBlock) => {
    // If API error fields were shown, use title forms from state, otherwise pass undefined
    const titleFormsToSave = showApiErrorFields ? modalTitleForms : undefined;
    try {
      await props.onSave(values, titleFormsToSave);
      props.onClose(); // Close only on successful save without API error or successful save from dialog
    } catch (error) {
      if (error instanceof InkLuminApiError) {
        setApiErrorMessage(`Ошибка API: ${error.message}. Введите формы названия вручную.`);
        // Ensure modalTitleForms is up-to-date before showing fields
        setModalTitleForms(prev => ({
          ...(props.initialData?.titleForms || defaultTitleForms), // Start from initial or defaults
          ...prev, // Overlay any already entered manual data
          nominative: values.title || prev.nominative // Ensure nominative matches current title
        }));
        setShowApiErrorFields(true);
        // Do not close modal
      } else {
        // Handle other errors (e.g., display a generic notification)
        console.error("Error saving block:", error);
        // Optionally, show a generic error message to the user
        // For now, we let it propagate or be handled by props.onSave's implementation
        props.onClose(); // Close on other errors for now, or handle more gracefully
      }
    }
  };

  const handleDialogTitleFormChange = (field: keyof IBlockTitleForms, value: string) => {
    setModalTitleForms(prev => ({
      ...(prev || defaultTitleForms), // Ensure prev is not null
      [field]: value,
    }));
  };

  return (
    <>
      <Modal
          title={props.initialData?.uuid ? 'Редактирование блока' : 'Создание нового блока'}
          opened={props.isOpen}
          onClose={() => {
            props.onClose();
            setShowApiErrorFields(false); // Reset on close
            setApiErrorMessage(null);
          }}
          fullScreen={isMobile}
          size="lg"
      >
        <form onSubmit={form.onSubmit(handleFormSubmit)}>
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
          {showApiErrorFields && (
              <>
                <Alert color="orange" title="Внимание" mt="md">
                  {apiErrorMessage || "Сервис автоматического определения форм названия недоступен. Пожалуйста, введите формы вручную."}
                </Alert>
                <Title order={5} mt="lg" mb="xs">Формы названия (ручной ввод):</Title>
                <SimpleGrid cols={2} spacing="sm">
                  <TextInput label="Именительный (кто? что?)" value={modalTitleForms.nominative} onChange={(e) => handleDialogTitleFormChange('nominative', e.currentTarget.value)} />
                  <TextInput label="Родительный (кого? чего?)" value={modalTitleForms.genitive} onChange={(e) => handleDialogTitleFormChange('genitive', e.currentTarget.value)} />
                  <TextInput label="Дательный (кому? чему?)" value={modalTitleForms.dative} onChange={(e) => handleDialogTitleFormChange('dative', e.currentTarget.value)} />
                  <TextInput label="Винительный (кого? что?)" value={modalTitleForms.accusative} onChange={(e) => handleDialogTitleFormChange('accusative', e.currentTarget.value)} />
                  <TextInput label="Творительный (кем? чем?)" value={modalTitleForms.instrumental} onChange={(e) => handleDialogTitleFormChange('instrumental', e.currentTarget.value)} />
                  <TextInput label="Предложный (о ком? о чём?)" value={modalTitleForms.prepositional} onChange={(e) => handleDialogTitleFormChange('prepositional', e.currentTarget.value)} />
                  <TextInput label="Множественное число (Им.)" style={{ gridColumn: '1 / -1' }} value={modalTitleForms.plural} onChange={(e) => handleDialogTitleFormChange('plural', e.currentTarget.value)} />
                </SimpleGrid>
              </>
          )}

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={() => {
              props.onClose();
              setShowApiErrorFields(false);
              setApiErrorMessage(null);
            }}>Отмена</Button>
            <Button type="submit">{showApiErrorFields ? "Сохранить с ручным вводом" : "Сохранить"}</Button>
          </Group>
        </form>
      </Modal>
    </>
  )
}
