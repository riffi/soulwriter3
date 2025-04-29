import {IBlockParameterPossibleValue} from "@/entities/ConstructorEntities";
import {RichEditor} from "@/components/shared/RichEditor/RichEditor";
import {Select, TextInput, useMantineTheme} from "@mantine/core";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

export interface ParameterRendererProps {
  dataType: string;
  value: string;
  possibleValues?: IBlockParameterPossibleValue[];
  onValueChange: (value: string) => void;
}

export const ParameterRenderer = ({
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
