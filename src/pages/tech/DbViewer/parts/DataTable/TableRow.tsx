import { Table, Text, Group, Stack, Box, ActionIcon } from '@mantine/core';
import { RelationPopup } from './RelationPopup';
import { DatabaseType, relations, TableData, TableName } from "@/pages/tech/DbViewer/types";
import { getReverseRelations } from "./utils";
import { useMemo } from 'react';

interface TableRowProps {
  item: Record<string, unknown>;
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

const TableCellContent = ({
                            value,
                            isPriority,
                            tableName,
                            fieldKey,
                            targetTables,
                            onClick
                          }: {
  value: unknown;
  isPriority: boolean;
  tableName: TableName;
  fieldKey: string;
  targetTables: TableData[];
  onClick: () => void;
}) => {
  const relatedEntry = useMemo(() =>
          getRelatedEntry(tableName, fieldKey, value, targetTables),
      [tableName, fieldKey, value, targetTables]
  );

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
            {value === undefined
                ? '—'
                : typeof value === 'string'
                    ? value
                    : typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
          </Text>
          {relatedEntry && <RelationPopup relatedEntry={relatedEntry} />}
        </Group>

        {relatedEntry?.title && (
            <Text size="xs" color="gray" style={{ lineHeight: 1.2, marginTop: 2 }}>
              {relatedEntry.title}
            </Text>
        )}
      </Stack>
  );
};

const getRelatedEntry = (
    tableName: TableName,
    key: string,
    value: unknown,
    tables: TableData[]
) => {
  const relation = relations[tableName]?.[key];
  if (!relation || !value) return null;

  return tables
  .find(t => t.name === relation.table)
  ?.data.find(item => item[relation.field] === value);
};

export const TableRow = ({
                           item,
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

  const reverseLinks = useMemo(() =>
          getReverseRelations(tableName)
          .map(rel => {
            const value = item[rel.targetField];
            if (!value) return null;

            const sourceTables = activeTab === 'book' ? bookTables : configTables;
            const sourceTable = sourceTables.find(t => t.name === rel.sourceTable);
            const count = sourceTable?.data
            .filter((entry: any) => entry[rel.sourceField] === value)
                .length || 0;

            return count > 0 ? { ...rel, value, count } : null;
          })
          .filter(Boolean),
      [tableName, item, activeTab, bookTables, configTables]
  );

  return (
      <>
        <Table.Tr>
          {allKeys.map((key) => (
              <Table.Td key={`${tableName}-${key}`} style={cellStyle}>
                <TableCellContent
                    value={item[key]}
                    isPriority={isPriorityField(key)}
                    tableName={tableName}
                    fieldKey={key}
                    targetTables={targetTables}
                    onClick={() => onValueClick(key, String(item[key]))}
                />
              </Table.Td>
          ))}
        </Table.Tr>

        {reverseLinks.length > 0 && <ReverseRelationLinks links={reverseLinks} onClick={onReverseRelationClick} />}
      </>
  );
};

const ReverseRelationLinks = ({ links, onClick }: {
  links: Array<{ sourceTable: string; sourceField: string; value: string; count: number }>;
  onClick: (tableName: TableName, field: string, value: string) => void;
}) => (
    <Table.Tr>
      <Table.Td colSpan={100} style={{ paddingTop: 0, paddingBottom: 16, paddingLeft: 16 }}>
        <Group pt={5}>
          <Text size="sm" fw={200} c="dimmed">Ссылаются:</Text>
          <Group gap={8} wrap="wrap">
            {links.map((link) => (
                <ReverseRelationLink
                    key={`${link.sourceTable}-${link.sourceField}-${link.value}`}
                    link={link}
                    onClick={onClick}
                />
            ))}
          </Group>
        </Group>
      </Table.Td>
    </Table.Tr>
);

const ReverseRelationLink = ({ link, onClick }: {
  link: { sourceTable: string; sourceField: string; value: string; count: number };
  onClick: (tableName: TableName, field: string, value: string) => void;
}) => (
    <Box
        p={2}
        style={{ borderRadius: 4, cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(link.sourceTable as TableName, link.sourceField, link.value);
        }}
    >
      <Text size="xs" c="dimmed">
        {link.sourceTable} <Text span fw={600} c="dimmed">({link.count})</Text>
      </Text>
    </Box>
);
