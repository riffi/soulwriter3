import {IBlockParameterPossibleValue} from "@/entities/ConstructorEntities";
import {RichEditor} from "@/components/shared/RichEditor/RichEditor";
import {Select, TextInput} from "@mantine/core";

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
  if (dataType === 'text') {
    return (
        <RichEditor
            initialContent={value}
            onContentChange={onValueChange}
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
      />
  );
};
