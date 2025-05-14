import { Box, Text } from '@mantine/core';

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
      <Text color="blue" style={{ cursor: 'pointer' }} onClick={onBackToTables}>
        ← К списку таблиц
      </Text>
      {historyLength > 1 && (
          <Text color="blue" style={{ cursor: 'pointer' }} onClick={onHistoryBack}>
            ← Назад
          </Text>
      )}
    </Box>
);
