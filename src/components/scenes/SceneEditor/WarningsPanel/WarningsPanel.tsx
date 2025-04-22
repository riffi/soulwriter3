// components/WarningsPanel/WarningsPanel.tsx
import { Paper, Text } from "@mantine/core";
import { WarningList } from "./WarningList";
import { WarningIteration } from "./WarningIteration";

import {IWarning, IWarningGroup} from "@/components/shared/RichEditor/types";
import {useEffect} from "react";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

export interface IWarningsPanelProps {
  warningGroups: IWarningGroup[];
  onSelectGroup?: (warningGroup: IWarningGroup) => void;
  selectedGroup?: IWarningGroup;
  displayType?: 'list' | 'iteration';
}

export const WarningsPanel = (props: IWarningsPanelProps) => {

  const { isMobile} = useMedia();

  const rawIndex = props.warningGroups?.findIndex(group =>
      group.groupIndex === props.selectedGroup?.groupIndex
  ) ?? 0

  const currentIndex = Math.max(rawIndex, 0)

  useEffect(() => {
    if (!props.selectedGroup && props.warningGroups.length > 0) {
      props.onSelectGroup?.(props.warningGroups[0]);
    }
  }, [props.selectedGroup, currentIndex])

  const content = (
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
  )
  return (
      <>
        {!isMobile &&
        <Paper withBorder p="md" radius="sm" shadow="sm" style={{ maxHeight: 300, overflow: 'auto' }}>
          {content}
        </Paper>
        }
        {isMobile && content}
      </>

  );
};
