import {Table, Text, Box, ActionIcon, Group} from '@mantine/core';
import { RelationPopup } from './RelationPopup';
import {DatabaseType, relations, TableData, TableName} from "@/pages/tech/DbViewer/types";
import {getReverseRelations} from "@/pages/tech/DbViewer/parts/DataTable/utils";

interface TableRowProps {
  item: any;
  index: number;
  allKeys: string[];
  table: TableData;
  activeTab: DatabaseType;
  bookTables: TableData[];
  configTables: TableData[];
  isPriorityField: (key: string) => boolean;
  onValueClick: (key: string, value: string) => void;
  onReverseRelationClick: (tableName: TableName, field: string, value: string) => void;
}

export const TableRow = ({
                           item,
                           index,
                           allKeys,
                           table,
                           activeTab,
                           bookTables,
                           configTables,
                           isPriorityField,
                           onValueClick,
                           onReverseRelationClick
                         }: TableRowProps) => {
  const reverseLinks = getReverseRelations(table.name as TableName)
  .map(rel => {
    const value = item[rel.targetField];
    if (!value) return null;

    const sourceTables = activeTab === 'book' ? bookTables : configTables;
    const sourceTable = sourceTables.find(t => t.name === rel.sourceTable);
    if (!sourceTable) return null;

    const count = sourceTable.data.filter((entry: any) => entry[rel.sourceField] === value).length;
    return count > 0 ? { ...rel, value, count } : null;
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Text
                        span
                        style={{
                          color: typeof value === 'string' && value.includes('uuid') ? 'blue' : '#343a40',
                          fontSize: '14px',
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

                      return relatedEntry && <RelationPopup relatedEntry={relatedEntry} />;
                    })()}
                  </div>

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
              <Table.Td colSpan={allKeys.length} style={{
                paddingTop: 0,
                paddingBottom: 16,
                paddingLeft: 16,
                backgroundColor: 'white'
              }}>
                <Group style={{paddingTop:5}}>
                <Text
                    size="sm"
                    fw={200}
                    color="dimmed"
                >Ссылаются:</Text>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {reverseLinks.map((link: any) => (
                      <Box
                          key={`${link.sourceTable}-${link.sourceField}`}
                          p={2}
                          style={{
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReverseRelationClick(link.sourceTable, link.sourceField, link.value);
                          }}
                      >
                        <Text size="xs" color="dimmed">
                          {link.sourceTable} <Text span c="dimmed" fw={600}>({link.count})</Text>
                        </Text>
                      </Box>
                  ))}
                </div>
                </Group>
              </Table.Td>
            </Table.Tr>
        )}
      </>
  );
};
