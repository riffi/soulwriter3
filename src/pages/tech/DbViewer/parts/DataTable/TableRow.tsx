import { Table, Text, Box, ActionIcon, Group, Stack } from '@mantine/core';
import { RelationPopup } from './RelationPopup';
import { DatabaseType, relations, TableData, TableName } from "@/pages/tech/DbViewer/types";
import { getReverseRelations } from "@/pages/tech/DbViewer/parts/DataTable/utils";

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

const cellStyle = {
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  maxWidth: '300px',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const getRelatedEntry = (tableName: TableName, key: string, value: any, tables: TableData[]) => {
  const relation = relations[tableName]?.[key];
  if (!relation || !value) return null;
  return tables.find(t => t.name === relation.table)
  ?.data.find((item: any) => item[relation.field] === value);
};

interface TableCellContentProps {
  value: any;
  isPriority: boolean;
  onClick: () => void;
}

const TableCellContent = ({
                            value,
                            isPriority,
                            tableName,
                            fieldKey,
                            targetTables,
                            onClick
                          }: TableCellContentProps) => {
  const relatedEntry = getRelatedEntry(tableName, fieldKey, value, targetTables);

  return (
      <Stack p={0} gap={0}>
        <Group gap={5}>
          <Text
              span
              style={{
                color: typeof value === 'string' && value.includes('uuid') ? 'blue' : '#343a40',
                fontSize: '14px',
                fontWeight: isPriority ? 600 : 400,
              }}
              onClick={onClick}
          >
            {value !== null ? JSON.stringify(value) : '—'}
          </Text>
          {relatedEntry && (
                <RelationPopup relatedEntry={relatedEntry} />
          )}
        </Group>

        {relatedEntry && (
            <>
              {relatedEntry?.title && (
                  <Text
                      size="xs"
                      color="gray"
                      style={{ display: 'block', lineHeight: 1.2, marginTop: 2 }}
                  >
                    {relatedEntry.title}
                  </Text>
              )}
            </>
        )}
      </Stack>
  );
};


interface ReverseRelationLinkProps {
  link: any;
  onReverseRelationClick: (tableName: TableName, field: string, value: string) => void;
}

const ReverseRelationLink = ({ link, onReverseRelationClick }: ReverseRelationLinkProps) => (
    <Box
        p={2}
        style={{ borderRadius: 4, cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onReverseRelationClick(link.sourceTable, link.sourceField, link.value);
        }}
    >
      <Text size="xs" color="dimmed">
        {link.sourceTable} <Text span c="dimmed" fw={600}>({link.count})</Text>
      </Text>
    </Box>
);

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
  const tableName = table.name as TableName;
  const targetTables = activeTab === 'book' ? bookTables : configTables;

  const reverseLinks = getReverseRelations(tableName)
  .map(rel => {
    const value = item[rel.targetField];
    if (!value) return null;

    const sourceTables = activeTab === 'book' ? bookTables : configTables;
    const count = sourceTables
    .find(t => t.name === rel.sourceTable)
    ?.data.filter((entry: any) => entry[rel.sourceField] === value)
        .length || 0;

    return count > 0 ? { ...rel, value, count } : null;
  })
  .filter(Boolean);

  return (
      <>
        <Table.Tr>
          {allKeys.map((key) => {
            const value = item[key] ?? null;
            const isPriority = isPriorityField(key);

            return (
                <Table.Td key={`${index}-${key}`} style={cellStyle}>
                  <Stack>
                    <TableCellContent
                        value={value}
                        isPriority={isPriority}
                        tableName={tableName}
                        fieldKey={key}
                        targetTables={targetTables}
                        onClick={() => onValueClick(key, String(value))}
                    />
                  </Stack>
                </Table.Td>
            );
          })}
        </Table.Tr>

        {reverseLinks.length > 0 && (
            <Table.Tr>
              <Table.Td
                  colSpan={allKeys.length}
                  style={{
                    paddingTop: 0,
                    paddingBottom: 16,
                    paddingLeft: 16,
                    backgroundColor: 'white'
                  }}
              >
                <Group style={{ paddingTop: 5 }}>
                  <Text size="sm" fw={200} color="dimmed">Ссылаются:</Text>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {reverseLinks.map((link: any) => (
                        <ReverseRelationLink
                            key={`${link.sourceTable}-${link.sourceField}-${link.value}`}
                            link={link}
                            onReverseRelationClick={onReverseRelationClick}
                        />
                    ))}
                  </div>
                </Group>
              </Table.Td>
            </Table.Tr>
        )}
      </>
  );
};
