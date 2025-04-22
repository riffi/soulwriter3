// components/WarningsPanel/WarningsPanel.tsx
import { Paper, Text } from "@mantine/core";
import { WarningList } from "./WarningList";
import { WarningIteration } from "./WarningIteration";

import {IWarning, IWarningGroup} from "@/components/shared/RichEditor/types";

export interface IWarningsPanelProps {
  warningGroups: IWarningGroup[];
  onSelectGroup?: (warningGroup: IWarningGroup) => void;
  selectedGroup?: IWarningGroup;
  displayType?: 'list' | 'iteration';
}

export const WarningsPanel = (props: IWarningsPanelProps) => {


  const rawIndex = props.warningGroups?.findIndex(group =>
      group.groupIndex === props.selectedGroup?.groupIndex
  ) ?? 0


  const currentIndex = Math.max(rawIndex, 0)

  return (
      <Paper withBorder p="lg" radius="md" shadow="sm">
        <Text size="lg" fw={500} mb="sm">Замечания</Text>

        <>
          {props.warningGroups && props.displayType === 'iteration' ? (
              <WarningIteration
                  warningGroups={props.warningGroups}
                  currentIndex={currentIndex}
                  selectedGroup={props.selectedGroup}
                  onSelectGroup={props.onSelectGroup}
              />
          ) : (
              <WarningList {...props} />
          )}
        </>
      </Paper>
  );
};
