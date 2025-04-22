import {IWarningsPanelProps} from "@/components/scenes/SceneEditor/WarningsPanel/WarningsPanel";

export const useWarningsData = ({ warningContainers, selectedWarning }: IWarningsPanelProps) => {
  const flatWarningGroupList = warningContainers.flatMap(container =>
      container.warningGroups.map(group => ({
        items: group.warnings
      }))
  );

  const currentIndex = flatWarningGroupList.findIndex(group =>
      group.items.some(w => w.id === selectedWarning?.id)
  );

  return { flatWarningGroupList, currentIndex };
};
