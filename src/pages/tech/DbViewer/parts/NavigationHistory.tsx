import {Box, Text, ActionIcon, Group, Button} from '@mantine/core';
import { IconArrowLeft, IconTable } from '@tabler/icons-react';

interface NavigationHistoryProps {
  historyLength: number;
  onBackToTables: () => void;
  onHistoryBack: () => void;
}

export const NavigationHistory = ({
                                    historyLength,
                                    onBackToTables,
                                    onHistoryBack,
                                  }: NavigationHistoryProps) => (
    <Box mb="md" style={{ display: 'flex', gap: 12 }}>
        <Button
            leftSection={<IconTable size={20} />}
            onClick={onBackToTables}
        >
          К таблицам
        </Button>

      {historyLength > 1 && (
          <Button
              leftSection={<IconArrowLeft size={20} />}
              onClick={onHistoryBack}
          >
            Назад
          </Button>
      )}
    </Box>
);
