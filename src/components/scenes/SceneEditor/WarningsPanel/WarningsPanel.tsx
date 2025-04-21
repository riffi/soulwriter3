import {
  IClicheWarning,
  IRepeatWarning, IWarning,
  IWarningContainer,
  IWarningKind,
  IWarningKindTile
} from "@/components/shared/RichEditor/types";
import {Group, Paper, Text} from "@mantine/core";

export interface IWarningsPanelProps {
  warningContainers: IWarningContainer[];
  onSelectWarning?: (warning: IWarning) => void;
}
export const WarningsPanel = (props: IWarningsPanelProps) => {
  return <>
    <Paper withBorder p="lg" radius="md" shadow="sm">
      <Text size="lg" fw={500} mb="sm">Замечания</Text>

      <>
        {props.warningContainers?.map((warningContainer, index) => {
          const isRepeat = warningContainer.warningKind === IWarningKind.REPEAT;
          return (
              <div key={index}>
                <Text size="sm" fw={500} mb="xs">
                  {IWarningKindTile[warningContainer.warningKind]}
                </Text>
                {isRepeat ? (
                    Object.entries(
                        warningContainer.warnings.reduce<Record<string, IRepeatWarning[]>>(
                            (groups, warning) => {
                              const groupIndex = (warning as IRepeatWarning).groupIndex;
                              if (!groups[groupIndex]) groups[groupIndex] = [];
                              groups[groupIndex].push(warning as IRepeatWarning);
                              return groups;
                            }, {}
                        )
                    ).map(([groupIndex, warnings]) => (
                        <div key={groupIndex} style={{ marginBottom: 12 }}>
                          <Text size="xs" c="dimmed" mb={4}>
                            Группа {groupIndex}
                          </Text>
                          <Text
                              size="sm"

                          >
                            <Group

                            >
                            {warnings.map(w =>
                                <div
                                    onClick={() => props.onSelectWarning?.(w)}
                                >
                                  {w.text}
                                </div>
                            )}
                            </Group>
                          </Text>
                        </div>
                    ))
                ) : (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {warningContainer.warnings.map((warning, idx) => (
                          <li
                              key={idx}
                              style={{ fontSize: 14, marginBottom: 4 }}
                              onClick={() => props.onSelectWarning?.(warning)}
                          >
                            {warning.text}
                            <Text
                                size="xs"
                                c="dimmed"

                            >
                              {(warning as IClicheWarning).pattern}
                            </Text>
                          </li>
                      ))}
                    </ul>
                )}
              </div>
          );
        })}
      </>
    </Paper>
  </>
}
