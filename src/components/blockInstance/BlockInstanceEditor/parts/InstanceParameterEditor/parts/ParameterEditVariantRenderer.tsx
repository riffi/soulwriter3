import {
  IBlock, IBlockParameter,
  IBlockParameterDataType,
  IBlockParameterPossibleValue, IBlockRelation
} from "@/entities/ConstructorEntities";
import {RichEditor} from "@/components/shared/RichEditor/RichEditor";
import {Checkbox, ColorPicker, Select, TextInput, useMantineTheme} from "@mantine/core";
import { DatePicker } from '@mantine/dates';
import '@mantine/dates/styles.css';
import 'dayjs/locale/ru';
import {relationUtils} from "@/utils/relationUtils";
import {BlockRepository} from "@/repository/BlockRepository";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";
import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockParameterInstance} from "@/entities/BookEntities";

export interface ParameterRendererProps {
  dataType: string;
  value: string;
  possibleValues?: IBlockParameterPossibleValue[];
  onValueChange: (value: string) => void;
  parameter: IBlockParameter;
  parameterInstance: IBlockParameterInstance;
  relatedBlocks?: IBlock[];
 }

export const ParameterEditVariantRenderer = ({
                             dataType,
                             value,
                             possibleValues,
                             onValueChange,
                             relatedBlocks,
                             parameter
                           }: ParameterRendererProps) => {

  const theme = useMantineTheme();



  if (dataType === 'text') {
    return (
        <RichEditor
            initialContent={value}
            onContentChange={onValueChange}
            desktopConstraints={
              {top: 25, bottom: 0}
            }
            mobileConstraints={
              {top: 80, bottom: 0}
            }
        />
    );
  }

  if (dataType === 'dropdown') {
    return (
        <Select
            data={(possibleValues || []).map(pv => ({
              value: pv.value,
              label: pv.value
            }))}
            value={value}
            onChange={value => onValueChange(value || '')}
            placeholder="Выберите значение"
        />
    );
  }

  if (dataType === IBlockParameterDataType.checkbox) {
    return (
        <Checkbox
            value={value}
            onChange={e => onValueChange(e.currentTarget.checked)}
            />
    );
  }

  if (dataType === IBlockParameterDataType.datePicker) {
    return (
        <DatePicker
            value={value}
            onChange={onValueChange}
            locale="ru"
        />
    );
  }

  if (dataType === IBlockParameterDataType.colorPicker) {
    return (
        <ColorPicker
            value={value}
            onChange={onValueChange}
            format="hex"
            swatches={['#2e2e2e', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
        />
    );
  }

  if (dataType === IBlockParameterDataType.blockLink) {
    const relatedBlock = relatedBlocks?.find((b: IBlock) => b.uuid === parameter.relatedBlockUuid)
    const instances = useLiveQuery(() => BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock?.uuid))
    return (
        <Select
            placeholder={`Выберите ${relatedBlock?.titleForms.accusative}`}
            data={
              instances?.map(i => ({value: i.uuid, label: i.title}))
            }
            value={value}
            onChange={(value) => onValueChange(value || '')}
        />
    )
  }

  return (
      <TextInput
          value={value}
          onChange={e => onValueChange(e.currentTarget.value)}
          autoFocus
          styles={{
            input: {
              padding: theme.spacing.xs,
              height: 'auto',
              minHeight: '1rem',
              border: 'none',
              borderBottom: `1px solid ${theme.colors.gray[4]}`,
              borderRadius: 0,
              '&:focus': {
                borderBottom: `1px solid ${theme.colors.blue[6]}`,
              },
            },
          }}
      />
  );
};
