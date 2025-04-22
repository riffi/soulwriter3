import {IWarningKind, IWarningKindTile} from "@/components/shared/RichEditor/types";
import { Text} from "@mantine/core";
export const WarningList = ({ warningContainers, onSelectWarning }) => (
    <>
      {warningContainers?.map((container, index) => (
          <WarningContainer
              key={index}
              container={container}
              onSelectWarning={onSelectWarning}
          />
      ))}
    </>
);

const WarningContainer = ({ container, onSelectWarning }) => {
  return (
      <div>
        <Text size="sm" fw={500} mb="xs">
          {IWarningKindTile[container.warningKind]}
        </Text>

        {container.warningGroups?.map((group, i) => (
            <div key={i}>
              {container.warningKind === IWarningKind.REPEAT ? (
                  <RepeatWarnings warnings={group.warnings} onSelect={onSelectWarning} />
              ) : (
                  <ClicheWarnings warnings={group.warnings} onSelect={onSelectWarning} />
              )}
            </div>
        ))}
      </div>
  );
};
