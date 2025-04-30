import {
  IBlockParameterDataType,
  IBlockParameterPossibleValue
} from "@/entities/ConstructorEntities";
import {RichEditor} from "@/components/shared/RichEditor/RichEditor";
import {Checkbox, Select, TextInput, useMantineTheme} from "@mantine/core";

export interface ParameterRendererProps {
  dataType: string;
  value: string;
  possibleValues?: IBlockParameterPossibleValue[];
  onValueChange: (value: string) => void;
}

export const ParameterEditVariantRenderer = ({
                             dataType,
                             value,
                             possibleValues,
                             onValueChange
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
              {top: 100, bottom: 0}
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
