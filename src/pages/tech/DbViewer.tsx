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
  List,
} from '@mantine/core';
import { bookDb } from '@/entities/bookDb';
import { configDatabase } from '@/entities/configuratorDb';
import {NavigationHistory} from "@/pages/tech/DbViewer/parts/NavigationHistory";
import {DataTable} from "@/pages/tech/DbViewer/parts/DataTable/DataTable";
import {TableList} from "@/pages/tech/DbViewer/parts/TableList";
import {HistoryEntry, relations, TableData} from "@/pages/tech/DbViewer/types";
import {useLiveQuery} from "dexie-react-hooks";

type TableName = keyof typeof bookDb | keyof typeof configDatabase;
export type Filters = Record<string, string>;


export const DbViewer = () => {
  const [activeTab, setActiveTab] = useState<'book' | 'config'>('book');
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentFilter, setCurrentFilter] = useState<{ field: string; value: string } | null>(null);

  const [filters, setFilters] = useState<Filters>({});
  const handleAddFilter = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRemoveFilter = (field: string) => {
    const newFilters = { ...filters };
    delete newFilters[field];
    setFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({});
  };


  const handleTabChange = (tab: 'book' | 'config') => {
    setActiveTab(tab);
    setSelectedTable(null);
    setHistory([]);
    setCurrentFilter(null);
  };

  const loadTables = async (db: typeof bookDb | typeof configDatabase) => {
    return Promise.all(
        db.tables.map(async (table) => ({
          name: table.name,
          data: await table.orderBy(':id').toArray() // Добавляем сортировку для триггера реактивности
        }))
    );
  };

  const bookTables = useLiveQuery(async () => {
    return loadTables(bookDb);
  }, [activeTab]) || [];

  const configTables = useLiveQuery(async () => {
    return loadTables(configDatabase);
  }, [activeTab]) || [];

  const handleTableClick = (table: TableData) => {
    setHistory([{ table }]);
    setSelectedTable(table);
    setCurrentFilter(null);
  };

  const handleValueClick = async (key: string, value: string) => {

    const tableRelations = relations[selectedTable?.name as TableName];
    if (!tableRelations || !selectedTable) return;

    const relation = tableRelations[key];
    if (relation) {
      setLoading(true);
      try {
        const db = activeTab === 'book' ? bookDb : configDatabase;
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

  const handleReverseRelationClick = (
      tableName: TableName,
      field: string,
      value: string
  ) => {
    const tables = activeTab === 'book' ? bookTables : configTables;
    const targetTable = tables.find(t => t.name === tableName);
    if (targetTable) {
      const filteredData = targetTable.data.filter((item: any) => item[field] === value);
      const newEntry: HistoryEntry = {
        table: { name: tableName, data: filteredData },
        filter: { field, value },
      };
      setHistory(prev => [...prev, newEntry]);
      setSelectedTable({ name: tableName, data: filteredData });
      setCurrentFilter({ field, value });
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

  const handleDeleteRecord = async (tableName: TableName, id: number) => {
    setLoading(true);
    try {
      const db = activeTab === 'book' ? bookDb : configDatabase;
      await db[tableName].delete(id);
      await db[tableName].toArray();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (tableName: TableName, id: number, field: string, newValue: string) => {
    setLoading(true);
    try {
      const db = activeTab === 'book' ? bookDb : configDatabase;
      // Предполагаем, что у таблиц есть метод update
      await db[tableName].update(id, { [field]: newValue });
      await db[tableName].toArray();
    } finally {
      setLoading(false);
    }
  };


  return (
  <Box p="md">
    <Title order={2} mb="md">Database Explorer</Title>
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tabs.List>
        <Tabs.Tab value="book">Book Database</Tabs.Tab>
        <Tabs.Tab value="config">Config Database</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value={activeTab} pt="md">
        <LoadingOverlay visible={loading} />
        {selectedTable ? (
            <>
              <NavigationHistory
                  historyLength={history.length}
                  onBackToTables={() => {
                    setSelectedTable(null);
                    setHistory([]);
                    setCurrentFilter(null);
                  }}
                  onHistoryBack={handleHistoryBack}
              />
              <DataTable
                  table={selectedTable}
                  activeTab={activeTab}
                  currentFilter={currentFilter || undefined}
                  onValueClick={(key, value) => handleValueClick(key, value)}
                  onReverseRelationClick={handleReverseRelationClick}
                  bookTables={bookTables}
                  configTables={configTables}
                  filters={filters}
                  onAddFilter={handleAddFilter}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAllFilters={handleClearAllFilters}
                  onDeleteRecord={handleDeleteRecord}
                  onUpdateRecord={handleUpdateRecord}
              />
            </>
        ) : (
            <TableList tables={activeTab === 'book' ? bookTables : configTables} onTableClick={handleTableClick} />
        )}
      </Tabs.Panel>
    </Tabs>

  </Box>
);
};
