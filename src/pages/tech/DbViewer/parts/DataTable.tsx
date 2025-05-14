import {Box, Table, ScrollArea, Title, Text, Popover, ActionIcon} from '@mantine/core';
import {TableData, DatabaseType, relations, TableName} from '../types';
import {IconInfoCircle} from "@tabler/icons-react";

interface DataTableProps {
  table: TableData;
  activeTab: DatabaseType;
  currentFilter?: { field: string; value: string };
  onValueClick: (key: string, value: string) => void;
  bookTables: TableData[];
  configTables: TableData[];
  onReverseRelationClick: (tableName: TableName, field: string, value: string) => void;
}

const getReverseRelations = (currentTableName: TableName) => {
  const reverseRels = [];
  for (const [sourceTable, fields] of Object.entries(relations)) {
    for (const [sourceField, rel] of Object.entries(fields)) {
      if (rel.table === currentTableName) {
        reverseRels.push({
          sourceTable: sourceTable as TableName,
          sourceField,
          targetField: rel.field,
          db: rel.db,
        });
      }
    }
  }
  return reverseRels;
};

const RelationPopup = ({ relatedEntry }: { relatedEntry: any }) => {
  return (
      <Popover>
        <Popover.Target>
          <ActionIcon size="xs" onClick={(e) => e.stopPropagation()}>
            <IconInfoCircle style={{ width: '14px', height: '14px' }} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(relatedEntry, null, 2)}
          </Text>
        </Popover.Dropdown>
      </Popover>
  );
};


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
                {table.data.map((item, index) => {
                  const reverseLinks = getReverseRelations(table.name as TableName)
                  .map(rel => {
                    const value = item[rel.targetField];
                    if (!value) return null;

                    const sourceTables = activeTab === 'book' ? bookTables : configTables;
                    const sourceTable = sourceTables.find(t => t.name === rel.sourceTable);
                    if (!sourceTable) return null;

                    const count = sourceTable.data.filter((entry: any) => entry[rel.sourceField] === value).length;
                    return count > 0 ? {...rel, value, count} : null;
                  })
                  .filter(Boolean);

                  return (
                      <>
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
                                  <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
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
                                    {(() => {
                                      const relation = relations[table?.name as TableName]?.[key];
                                      if (!relation || !value) return null;

                                      const targetTables = activeTab === 'book' ? bookTables : configTables;
                                      const relatedTable = targetTables.find(t => t.name === relation.table);
                                      const relatedEntry = relatedTable?.data.find(
                                          (item: any) => item[relation.field] === value
                                      );

                                      return relatedEntry &&
                                          <RelationPopup relatedEntry={relatedEntry}/>;
                                    })()
                                    }
                                  </div>

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
                                                style={{
                                                  display: 'block',
                                                  lineHeight: 1.2,
                                                  marginTop: 2
                                                }}
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
                        {reverseLinks.length > 0 && (
                            <Table.Tr key={`${index}-links`}>
                              <Table.Td colSpan={allKeys.length}
                                        style={{paddingTop: 0, paddingBottom: 16}}>
                                <Text size="sm" fw={500} mb={4}>Linked from:</Text>
                                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                                  {reverseLinks.map((link: any) => (
                                      <Box
                                          key={`${link.sourceTable}-${link.sourceField}`}
                                          bg="gray.1"
                                          p={4}
                                          style={{
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            border: '1px solid #ddd',
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onReverseRelationClick(link.sourceTable, link.sourceField, link.value);
                                          }}
                                      >
                                        <Text size="sm">
                                          {link.sourceTable} <Text span c="blue"
                                                                   fw={600}>({link.count})</Text>
                                        </Text>
                                      </Box>
                                  ))}
                                </div>
                              </Table.Td>
                            </Table.Tr>
                        )}
                      </>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Box>
    );
};
