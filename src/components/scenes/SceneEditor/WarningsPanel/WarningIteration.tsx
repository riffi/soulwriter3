// components/WarningsPanel/WarningIteration.tsx
import {Group, Text} from "@mantine/core";
import {NavigationButtons} from "./NavigationButtons";
import {IWarning, IWarningGroup, IWarningKind} from "@/components/shared/RichEditor/types";

export interface IWarningIterationProps {
  warningGroups: IWarningGroup[];
  selectedGroup?: IWarningGroup;
  currentIndex?: number;
  onSelectGroup: (warningGroup: IWarningGroup) => void;
}
export const WarningIteration = (props: IWarningIterationProps) => {
  const currentGroup = props.warningGroups?.[props.currentIndex] ?? props.warningGroups?.[0];

  if (!currentGroup) {
    return <Text size="sm" c="dimmed">Нет замечаний</Text>;
  }


  return (
      <div>
        <NavigationButtons
            currentIndex={props.currentIndex}
            total={props.warningGroups.length}
            onNavigate={(direction) => {
              const newIndex = direction === 'prev' ? props.currentIndex - 1 : props.currentIndex + 1;
              props.onSelectGroup?.(props.warningGroups?.[newIndex]);
            }}
        />

        <div style={{ marginTop: 16 }}>
          <WarningGroup warningGroup={currentGroup}/>
        </div>
      </div>
  );
};

export interface IWarningGroupProps {
  warningGroup: IWarningGroup;
}
const WarningGroup = (props: IWarningGroupProps) => (
    <div>
      {props.warningGroup.warningKind === IWarningKind.CLICHE && <Text size="sm">Штамп:</Text>}
      {props.warningGroup.warningKind === IWarningKind.REPEAT && <Text size="sm">Повторы:</Text>}
      <Group>
        {props.warningGroup?.warnings?.map((w, i) => (
            <div key={w.id}>
              <Text size="sm">{w?.text}</Text>
            </div>
        ))}
      </Group>
    </div>
);


