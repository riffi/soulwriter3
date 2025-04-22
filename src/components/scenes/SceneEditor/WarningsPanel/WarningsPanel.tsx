// components/WarningsPanel/WarningsPanel.tsx
import { Paper, Text } from "@mantine/core";
import { WarningList } from "./WarningList";
import { WarningIteration } from "./WarningIteration";
import { useWarningsData } from "./useWarningsData";
import {IWarning, IWarningContainer} from "@/components/shared/RichEditor/types";

export interface IWarningsPanelProps {
  warningContainers: IWarningContainer[];
  onSelectWarning?: (warning: IWarning) => void;
  selectedWarning?: IWarning;
  displayType?: 'list' | 'iteration';
}

export const WarningsPanel = (props: IWarningsPanelProps) => {
  const { flatWarningGroupList, currentIndex } = useWarningsData({
    ...props,
    selectedWarning: props.selectedWarning // Явная передача пропса
  });

  return (
      <Paper withBorder p="lg" radius="md" shadow="sm">
        <Text size="lg" fw={500} mb="sm">Замечания</Text>

        <>
          {props.displayType === 'iteration' ? (
              <WarningIteration
                  warningGroups={flatWarningGroupList}
                  currentIndex={currentIndex}
                  onSelectWarning={props.onSelectWarning}
              />
          ) : (
              <WarningList {...props} />
          )}
        </>
      </Paper>
  );
};
