import {Box, Table, ScrollArea, Title, Text, Group, ActionIcon, Badge} from '@mantine/core';
import {DatabaseType, TableData, TableName} from "@/pages/tech/DbViewer/types";
import {TableHeader} from "@/pages/tech/DbViewer/parts/DataTable/TableHeader";
import {TableRow} from "@/pages/tech/DbViewer/parts/DataTable/TableRow";
import {Filters} from "@/pages/tech/DbViewer";
import {useMemo, useState} from "react";
import {IconFilter, IconX} from "@tabler/icons-react";

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

  const [showFilters, setShowFilters] = useState(true);

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

  const filteredData = useMemo(() => {
    return table.data.filter(item =>
        Object.entries(filters).every(([field, value]) =>
            String(item[field]).toLowerCase().includes(value.toLowerCase())
        ));
  }, [table.data, filters]);

  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    allKeys.forEach(key => {
      options[key] = Array.from(new Set(table.data.map(item => String(item[key])))).sort();
    });
    return options;
  }, [table.data, allKeys]);

  return (
      <Box mb="xl" p="lg" style={{backgroundColor: 'white'}}>
        <Group justify="space-between" mb="sm">
          <Title order={3}>{table.name}</Title>
          <Group gap="xs">
            <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => setShowFilters(!showFilters)}
            >
              <IconFilter size={18}/>
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={onClearAllFilters} >
              <IconX size={18}/>
            </ActionIcon>
          </Group>
        </Group>

        {showFilters && Object.keys(filters).length > 0 && (
            <Group gap="xs" mb="sm" align="center">
              <Text size="sm" c="dimmed">Active filters:</Text>
              {Object.entries(filters).map(([field, value]) => (
                  <Badge
                      key={field}
                      variant="outline"
                      rightSection={
                        <ActionIcon
                            size="xs"
                            color="red"
                            onClick={() => onRemoveFilter(field)}
                        >
                          <IconX size={10}/>
                        </ActionIcon>
                      }
                  >
                    {field}: {value}
                  </Badge>
              ))}
            </Group>
        )}

        <ScrollArea>
          <Table highlightOnHover style={{ tableLayout: 'auto' }}>
            <TableHeader
                keys={allKeys}
                isPriorityField={isPriorityField}
                filters={filters}
                onAddFilter={onAddFilter}
                onRemoveFilter={onRemoveFilter}
                filterOptions={filterOptions}
                showFilters={showFilters}
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
