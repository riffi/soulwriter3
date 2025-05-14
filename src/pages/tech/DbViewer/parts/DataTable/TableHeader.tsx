import { Table, Text } from '@mantine/core';

interface TableHeaderProps {
  keys: string[];
  isPriorityField: (key: string) => boolean;
}

export const TableHeader = ({ keys, isPriorityField }: TableHeaderProps) => (
    <Table.Thead>
      <Table.Tr>
        {keys.map((key) => (
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
);
