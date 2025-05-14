import {Box, Table, ScrollArea, Title, Text} from '@mantine/core';
import {DatabaseType, TableData, TableName} from "@/pages/tech/DbViewer/types";
import {TableHeader} from "@/pages/tech/DbViewer/parts/DataTable/TableHeader";
import {TableRow} from "@/pages/tech/DbViewer/parts/DataTable/TableRow";
import {Filters} from "@/pages/tech/DbViewer";
import {useMemo} from "react";


interface DataTableProps {
  table: TableData;
  activeTab: DatabaseType;
  currentFilter?: { field: string; value: string };
  onValueClick: (key: string, value: string) => void;
  bookTables: TableData[];
  configTables: TableData[];
  onReverseRelationClick: (tableName: TableName, field: string, value: string) => void;
  filters: Filters;
  onAddFilter: (field: string, value: string) => void;
  onRemoveFilter: (field: string) => void;
  onClearAllFilters: () => void;
}

const isPriorityField = (key: string) => ['id', 'uuid', 'title'].includes(key);

export const DataTable = ({
                            table,
                            activeTab,
                            currentFilter,
                            onValueClick,
                            bookTables,
                            configTables,
                            onReverseRelationClick,
                            filters,
                            onAddFilter,
                            onRemoveFilter,
                            onClearAllFilters,
                          }: DataTableProps) => {

  const filteredData = useMemo(() => {
    return table.data.filter(item =>
        Object.entries(filters).every(([field, value]) =>
            String(item[field]).toLowerCase().includes(value.toLowerCase())
        ));
  }, [table.data, filters]);

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

  return (
      <Box mb="xl" p="lg" style={{backgroundColor: 'white'}}>
        <Title order={3} mb="sm">
          {table.name}
          {Object.keys(filters).length > 0 && (
              <Box size="sm" color="dimmed" mt={4}>
                Active filters:
                {Object.entries(filters).map(([field, value]) => (
                  <span key={field} style={{ marginRight: 8 }}>
                    {field} = {value}
                  </span>
                ))}
                <button
                    onClick={onClearAllFilters}
                    style={{
                      marginLeft: 10,
                      background: 'none',
                      border: 'none',
                      color: '#228be6',
                      cursor: 'pointer'
                    }}
                >
                  Clear all
                </button>
              </Box>
          )}
        </Title>

        <ScrollArea>
          <Table

              highlightOnHover
              style={{ tableLayout: 'auto' }}>
            <TableHeader
                keys={allKeys}
                isPriorityField={isPriorityField}
                filters={filters}
                onAddFilter={onAddFilter}
                onRemoveFilter={onRemoveFilter}
            />
            <Table.Tbody>
              {filteredData.map((item, index) => (
                  <TableRow
                      key={index}
                      item={item}
                      index={index}
                      allKeys={allKeys}
                      table={table}
                      activeTab={activeTab}
                      bookTables={bookTables}
                      configTables={configTables}
                      isPriorityField={isPriorityField}
                      onValueClick={onValueClick}
                      onReverseRelationClick={onReverseRelationClick}
                  />
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Box>
  );
};
