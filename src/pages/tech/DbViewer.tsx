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

export const DbViewer = () => {
  const [activeTab, setActiveTab] = useState<'book' | 'config'>('book');
  const [bookTables, setBookTables] = useState<TableData[]>([]);
  const [configTables, setConfigTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTableList('book');
    loadTableList('config');
  }, []);

  const handleTabChange = (tab: 'book' | 'config') => {
    setActiveTab(tab);
    setSelectedTable(null); // Сбрасываем выбранную таблицу при переключении вкладок
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

      if (dbType === 'book') setBookTables(tables);
      else setConfigTables(tables);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table);
  };

  const handleValueClick = async (key: string, value: string, currentDb: 'book' | 'config') => {
    const relations: Record<TableName, Record<string, { table: TableName; field: string; db: 'book' | 'config' }>> = {
      configurationVersions:{
        configurationUuid: { table: 'bookConfigurations', field: 'uuid'},
      },
      blockInstances: {
        blockUuid: { table: 'blocks', field: 'uuid'}
      },
      blocks: {
        parentBlockUuid: { table: 'blocks', field: 'uuid'},
        configurationVersionUuid: { table: 'configurationVersions', field: 'uuid' }
      },
      blockParameters: {
        blockUuid: { table: 'blocks', field: 'uuid'},
        linkedBlockUuid: { table: 'blocks', field: 'uuid'}
      }
    };

    const tableRelations = relations[selectedTable?.name as TableName];
    if (!tableRelations) return;

    const relation = tableRelations[key];
    if (relation) {
      setLoading(true);
      try {
        const db = currentDb === 'book' ? bookDb : configDatabase;
        const relatedData = await db[relation.table]
        .where(relation.field)
        .equals(value)
        .toArray();

        setSelectedTable({
          name: relation.table,
          data: relatedData
        });
      } finally {
        setLoading(false);
      }
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
    // Собираем все уникальные ключи из всех записей
    const allKeys = Array.from(
        new Set(table.data.flatMap(item => Object.keys(item)))
    );

    return (
        <Box mb="xl">
          <Title order={3} mb="sm">
            {table.name} ({activeTab} database)
          </Title>

          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  {allKeys.map((key) => (
                      <Table.Th
                          key={key}
                          style={{ textAlign: 'left' }}
                      >
                        {key}
                      </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <tbody>
              {table.data.map((item, index) => (
                  <Table.Tr key={index}>
                    {allKeys.map((key) => {
                      const value = item.hasOwnProperty(key) ? item[key] : null;
                      return (
                          <Table.Td key={key} style={{ cursor: 'pointer' }}>
                            <Text
                                span
                                style={{
                                  color: typeof value === 'string' && value.includes('uuid') ? 'blue' : 'gray',
                                  fontSize: '12px',
                                }}
                                onClick={() => handleValueClick(key, String(value), activeTab)}
                            >
                              {value !== null ? JSON.stringify(value) : '—'}
                            </Text>
                          </Table.Td>
                      )})}
                  </Table.Tr>
              ))}
              </tbody>
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
                  <Text
                      mb="md"
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTable(null)}
                  >
                    ← Back to tables list
                  </Text>
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
                  <Text
                      mb="md"
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTable(null)}
                  >
                    ← Back to tables list
                  </Text>
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
