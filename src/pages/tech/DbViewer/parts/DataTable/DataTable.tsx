import {Box, Table, ScrollArea, Title, Text} from '@mantine/core';
import {DatabaseType, TableData, TableName} from "@/pages/tech/DbViewer/types";
import {TableHeader} from "@/pages/tech/DbViewer/parts/DataTable/TableHeader";
import {TableRow} from "@/pages/tech/DbViewer/parts/DataTable/TableRow";


interface DataTableProps {
  table: TableData;
  activeTab: DatabaseType;
  currentFilter?: { field: string; value: string };
  onValueClick: (key: string, value: string) => void;
  bookTables: TableData[];
  configTables: TableData[];
  onReverseRelationClick: (tableName: TableName, field: string, value: string) => void;
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

  return (
      <Box mb="xl">
        <Title order={3} mb="sm">
          {table.name}
          {currentFilter && (
              <Text size="sm" color="dimmed" mt={4}>
                Filtered by: {currentFilter.field} = {currentFilter.value}
              </Text>
          )}
        </Title>

        <ScrollArea>
          <Table striped highlightOnHover style={{ tableLayout: 'auto' }}>
            <TableHeader keys={allKeys} isPriorityField={isPriorityField} />
            <Table.Tbody>
              {table.data.map((item, index) => (
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
