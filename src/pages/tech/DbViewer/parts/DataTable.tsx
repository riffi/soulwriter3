import { Box, Table, ScrollArea, Title, Text } from '@mantine/core';
import {TableData, DatabaseType, relations, TableName} from '../types';

interface DataTableProps {
  table: TableData;
  activeTab: DatabaseType;
  currentFilter?: { field: string; value: string };
  onValueClick: (key: string, value: string) => void;
  bookTables: TableData[];
  configTables: TableData[];
}

export const DataTable = ({
                            table,
                            activeTab,
                            currentFilter,
                            onValueClick,
                            bookTables,
                            configTables,
                          }: DataTableProps) => {

    // Собираем и сортируем ключи с приоритетом для id, uuid, title
    const allKeys = Array.from(
        new Set(table.data.flatMap(item => Object.keys(item)))
    ).sort((a, b) => {
      const priorityFields = ['id', 'uuid', 'title'];
      const aPriority = priorityFields.indexOf(a);
      const bPriority = priorityFields.indexOf(b);

      if (aPriority === -1 && bPriority === -1) return a.localeCompare(b);
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    });

    const isPriorityField = (key: string) => ['id', 'uuid', 'title'].includes(key);

    return (
        <Box mb="xl">
          <Title order={3} mb="sm">
            {table.name} ({activeTab} database)
            {currentFilter && (
                <Text size="sm" color="dimmed" mt={4}>
                  Filtered by: {currentFilter.field} = {currentFilter.value}
                </Text>
            )}
          </Title>

          <ScrollArea>
            <Table striped highlightOnHover style={{ tableLayout: 'auto' }}>
              <Table.Thead>
                <Table.Tr>
                  {allKeys.map((key) => (
                      <Table.Th
                          key={key}
                          style={{
                            textAlign: 'left',
                            fontWeight: isPriorityField(key) ? 700 : 500,
                            borderBottom: isPriorityField(key) ? '2px solid #343a40' : 'none',
                            whiteSpace: 'nowrap',
                            minWidth: 'min-content',
                            maxWidth: '300px'
                          }}
                      >
                        {key}
                      </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {table.data.map((item, index) => (
                    <Table.Tr key={index}>
                      {allKeys.map((key) => {
                        const value = item.hasOwnProperty(key) ? item[key] : null;
                        return (
                            <Table.Td
                                key={key}
                                style={{
                                  cursor: 'pointer',
                                  fontWeight: isPriorityField(key) ? 600 : 400,
                                  whiteSpace: 'nowrap',
                                  maxWidth: '300px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                            >
                              <Text
                                  span
                                  style={{
                                    color: typeof value === 'string' && value.includes('uuid') ? 'blue' : '#343a40',
                                    fontSize: '12px',
                                  }}
                                  onClick={() => onValueClick(key, String(value))}
                              >
                                {value !== null ? JSON.stringify(value) : '—'}
                              </Text>

                              {/* Добавляем отображение связанного title */}
                              {(relations[table?.name as TableName]?.[key] && value) && (() => {
                                const relation = relations[table!.name][key];
                                const targetTables = activeTab === 'book' ? bookTables : configTables;
                                const relatedTable = targetTables.find(t => t.name === relation.table);
                                const relatedEntry = relatedTable?.data.find(
                                    (item: any) => item[relation.field] === value
                                );

                                return (
                                    relatedEntry?.title && (
                                        <Text
                                            size="xs"
                                            color="gray"
                                            style={{ display: 'block', lineHeight: 1.2, marginTop: 2 }}
                                        >
                                          {relatedEntry.title}
                                        </Text>
                                    )
                                );
                              })()}
                            </Table.Td>
                        );
                      })}
                    </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Box>
    );
};
