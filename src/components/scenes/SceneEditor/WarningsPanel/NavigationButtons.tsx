// components/WarningsPanel/NavigationButtons.tsx
import { Group, Button, Text } from "@mantine/core";

export const NavigationButtons = ({ currentIndex, total, onNavigate }) => (
    <Group justify="center" mb="sm">
      <Button
          variant="subtle"
          onClick={() => onNavigate('prev')}
          disabled={currentIndex <= 0}
      >
        ←
      </Button>
      <Text size="sm">{currentIndex + 1} из {total}</Text>
      <Button
          variant="subtle"
          onClick={() => onNavigate('next')}
          disabled={currentIndex >= total - 1}
      >
        →
      </Button>
    </Group>
);
