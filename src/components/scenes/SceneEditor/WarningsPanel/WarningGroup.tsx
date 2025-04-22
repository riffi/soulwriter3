import {IWarningGroup, IWarningKind} from "@/components/shared/RichEditor/types";
import {IconAlertCircle, IconCircle, IconInfoCircle, IconRepeat} from "@tabler/icons-react";
import {Group, List, Text, ThemeIcon} from "@mantine/core";

export interface IWarningGroupProps {
  warningGroup: IWarningGroup;
  onSelectGroup: (warningGroup: IWarningGroup) => void;
}
export const WarningGroup = (props: IWarningGroupProps) => {
  const getGroupDetails = () => {
    switch (props.warningGroup.warningKind) {
      case IWarningKind.CLICHE:
        return {
          title: "Штамп",
          color: "orange",
          icon: <IconAlertCircle size={18} />,
        };
      case IWarningKind.REPEAT:
        return {
          title: "Повторы",
          color: "blue",
          icon: <IconRepeat size={18} />,
        };
      default:
        return {
          title: "Замечание",
          color: "gray",
          icon: <IconInfoCircle size={18} />,
        };
    }
  };

  const { title, color, icon } = getGroupDetails();
  const count = props.warningGroup?.warnings?.length || 0;

  return (
      <>
        <Group spacing="xs" mb={4}>
          <ThemeIcon color={color} variant="light" size="xs">
            {icon}
          </ThemeIcon>
          <Text size="xs" weight={600} color={color}>
            {title} ({count})
          </Text>
        </Group>

        <Group size="xs" spacing={2}>
          {props.warningGroup?.warnings?.map((w) => (
                <Text size="xs" lineClamp={1} style={{ wordBreak: 'break-word' }}>
                  {w.text}
                </Text>
          ))}
        </Group>
      </>
  );
};
