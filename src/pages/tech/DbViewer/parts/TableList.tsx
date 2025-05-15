import { useState } from 'react';
import { Grid, Card, Text, Group, Badge, ThemeIcon, rem, TextInput } from '@mantine/core';
import { IconDatabase, IconTable } from '@tabler/icons-react';
import { TableData } from '../types';
import classes from './TableList.module.css';

interface TableListProps {
  tables: TableData[];
  onTableClick: (table: TableData) => void;
}

export const TableList = ({ tables, onTableClick }: TableListProps) => {
  const [filterText, setFilterText] = useState('');

  const filteredTables = tables.filter(table =>
      table.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
      <>
        <TextInput
            placeholder="Поиск таблиц..."
            value={filterText}
            onChange={(e) => setFilterText(e.currentTarget.value)}
            mb="md"
            px="md"
        />

        <Grid gutter="xl" p="md">
          {filteredTables.map((table) => (
              <Grid.Col key={table.name} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                    withBorder
                    padding="lg"
                    radius="md"
                    className={classes.card}
                    onClick={() => onTableClick(table)}
                >
                  <Group justify="space-between" mb="xs">
                    <ThemeIcon variant="light" size="xl" radius="md">
                      <IconTable style={{ width: rem(24), height: rem(24) }} />
                    </ThemeIcon>
                    <Badge variant="light" color="blue">
                      {table.data.length} entries
                    </Badge>
                  </Group>

                  <Text fz="lg" fw={600} truncate>
                    {table.name}
                  </Text>

                  <Group mt="md" gap="xs" c="dimmed">
                    <IconDatabase style={{ width: rem(16), height: rem(16) }} />
                    <Text fz="sm">Database table</Text>
                  </Group>
                </Card>
              </Grid.Col>
          ))}
        </Grid>
      </>
  );
};
