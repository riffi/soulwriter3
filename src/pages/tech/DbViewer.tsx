// DatabaseViewer.tsx
import { useState, useEffect } from 'react';
import {
  Table,
  ScrollArea,
  Title,
  LoadingOverlay,
  Text,
  Box,
  Tabs,
  List
} from '@mantine/core';
import { bookDb } from '@/entities/bookDb';
import { configDatabase } from '@/entities/configuratorDb';

type TableName = keyof typeof bookDb | keyof typeof configDatabase;

interface TableData {
  name: TableName;
  data: any[];
}

interface HistoryEntry {
  table: TableData;
  filter?: {
    field: string;
    value: string;
  };
}

const relations: Record<TableName, Record<string, { table: TableName; field: string; db: 'book' | 'config' }>> = {
  configurationVersions: {
    configurationUuid: { table: 'bookConfigurations', field: 'uuid'},
  },
  blockInstances: {
    blockUuid: { table: 'blocks', field: 'uuid'},
    parentInstanceUuid: { table: 'blockInstances', field: 'uuid'}
  },
  blocks: {
    parentBlockUuid: { table: 'blocks', field: 'uuid'},
    configurationVersionUuid: { table: 'configurationVersions', field: 'uuid' }
  },
  blockParameters: {
    blockUuid: { table: 'blocks', field: 'uuid' },
    linkedBlockUuid: { table: 'blocks', field: 'uuid'}
  },
  blocksRelations: {
    sourceBlockUuid: { table: 'blocks', field: 'uuid' },
    targetBlockUuid: { table: 'blocks', field: 'uuid' },
    configurationVersionUuid: { table: 'configurationVersions', field: 'uuid' }
  },
  blockTabs:{
    blockUuid: { table: 'blocks', field: 'uuid' },
  }
};

export const DbViewer = () => {
  const [activeTab, setActiveTab] = useState<'book' | 'config'>('book');
  const [bookTables, setBookTables] = useState<TableData[]>([]);
  const [configTables, setConfigTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentFilter, setCurrentFilter] = useState<{ field: string; value: string } | null>(null);

  useEffect(() => {
    loadTableList('book');
    loadTableList('config');
  }, []);

  const handleTabChange = (tab: 'book' | 'config') => {
    setActiveTab(tab);
    setSelectedTable(null);
    setHistory([]);
    setCurrentFilter(null);
  };

  const loadTableList = async (dbType: 'book' | 'config') => {
    setLoading(true);
    try {
      const db = dbType === 'book' ? bookDb : configDatabase;
      const tables = await Promise.all(
          db.tables.map(async (table) => ({
            name: table.name,
            data: await table.toArray()
          }))
      );

      dbType === 'book' ? setBookTables(tables) : setConfigTables(tables);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table: TableData) => {
    setHistory([{ table }]);
    setSelectedTable(table);
    setCurrentFilter(null);
  };

  const handleValueClick = async (key: string, value: string, currentDb: 'book' | 'config') => {


    const tableRelations = relations[selectedTable?.name as TableName];
    if (!tableRelations || !selectedTable) return;

    const relation = tableRelations[key];
    if (relation) {
      setLoading(true);
      try {
        const db = currentDb === 'book' ? bookDb : configDatabase;
        const relatedData = await db[relation.table]
        .where(relation.field)
        .equals(value)
        .toArray();

        const newEntry: HistoryEntry = {
          table: selectedTable,
          filter: { field: key, value }
        };

        setHistory(prev => [...prev, { table: { name: relation.table, data: relatedData }, filter: { field: key, value } }]);
        setSelectedTable({ name: relation.table, data: relatedData });
        setCurrentFilter({ field: key, value });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleHistoryBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevEntry = newHistory[newHistory.length - 1];

      setSelectedTable(prevEntry.table);
      setCurrentFilter(prevEntry.filter || null);
      setHistory(newHistory);
    }
  };

  const renderTableList = (tables: TableData[]) => (
      <List spacing="xs" size="xs">
        {tables.map((table) => (
            <List.Item
                key={table.name}
                onClick={() => handleTableClick(table)}
                style={{ cursor: 'pointer', padding: '2px' }}
                sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}
            >
              <Text weight={500}>{table.name}</Text>
            </List.Item>
        ))}
      </List>
  );

  const renderTableData = (table: TableData) => {
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
                                  onClick={() => handleValueClick(key, String(value), activeTab)}
                              >
                                {value !== null ? JSON.stringify(value) : '—'}
                              </Text>
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

  return (
      <Box p="md">
        <Title order={2} mb="md">Database Explorer</Title>

        <Tabs value={activeTab} onTabChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="book">Book Database</Tabs.Tab>
            <Tabs.Tab value="config">Config Database</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="book" pt="md">
            <LoadingOverlay visible={loading} />
            {selectedTable ? (
                <>
                  <Box mb="md" style={{ display: 'flex', gap: 12 }}>
                    <Text
                        color="blue"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedTable(null);
                          setHistory([]);
                          setCurrentFilter(null);
                        }}
                    >
                      ← Back to tables list
                    </Text>
                    {history.length > 1 && (
                        <Text
                            color="blue"
                            style={{ cursor: 'pointer' }}
                            onClick={handleHistoryBack}
                        >
                          ← Back to previous
                        </Text>
                    )}
                  </Box>
                  {renderTableData(selectedTable)}
                </>
            ) : (
                renderTableList(bookTables)
            )}
          </Tabs.Panel>

          <Tabs.Panel value="config" pt="md">
            <LoadingOverlay visible={loading} />
            {selectedTable ? (
                <>
                  <Box mb="md" style={{ display: 'flex', gap: 12 }}>
                    <Text
                        color="blue"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedTable(null);
                          setHistory([]);
                          setCurrentFilter(null);
                        }}
                    >
                      ← Back to tables list
                    </Text>
                    {history.length > 1 && (
                        <Text
                            color="blue"
                            style={{ cursor: 'pointer' }}
                            onClick={handleHistoryBack}
                        >
                          ← Back to previous
                        </Text>
                    )}
                  </Box>
                  {renderTableData(selectedTable)}
                </>
            ) : (
                renderTableList(configTables)
            )}
          </Tabs.Panel>
        </Tabs>
      </Box>
  );
};
