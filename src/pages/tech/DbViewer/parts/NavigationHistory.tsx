import { Box, Text } from '@mantine/core';
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
      <IconTable
          style={{ cursor: 'pointer' }}
          onClick={onBackToTables}
          size={20}
      />
      {historyLength > 1 && (
          <IconArrowLeft
              style={{ cursor: 'pointer' }}
              onClick={onHistoryBack}
              size={20}
          />
      )}
    </Box>
);
