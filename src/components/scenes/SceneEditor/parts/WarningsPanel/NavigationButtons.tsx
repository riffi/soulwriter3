// components/WarningsPanel/NavigationButtons.tsx
import { Group, Button, Text } from "@mantine/core";

export const NavigationButtons = ({ currentIndex, total, onNavigate }) => (
    <Group justify="center" gap="xs" >
      <Button
          variant="subtle"
          onClick={() => onNavigate('prev')}
          disabled={currentIndex <= 0}
          size="compact-sm"
      >
        ←
      </Button>
      <Text size="xs">{currentIndex + 1} из {total}</Text>
      <Button
          variant="subtle"
          onClick={() => onNavigate('next')}
          disabled={currentIndex >= total - 1}
          size="compact-sm"
      >
        →
      </Button>
    </Group>
);
