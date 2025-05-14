import {Table, Text, TextInput, Title} from '@mantine/core';
import {Filters} from "@/pages/tech/DbViewer";

interface TableHeaderProps {
  keys: string[];
  isPriorityField: (key: string) => boolean;
  filters: Filters;
  onAddFilter: (field: string, value: string) => void;
  onRemoveFilter: (field: string) => void;
}

export const TableHeader = ({ keys, isPriorityField, filters, onAddFilter, onRemoveFilter  }: TableHeaderProps) => (
    <Table.Thead>
      <Table.Tr>
        {keys.map((key) => (
            <Table.Th key={key} style={{
              backgroundColor: '#eee',
              border: '1px solid #ddd',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative' }}>
                  <TextInput
                      type="text"
                      value={filters[key] || ''}
                      onChange={(e) => onAddFilter(key, e.target.value)}
                      placeholder="Filter..."
                      style={{
                        width: '100%',
                        padding: '2px 5px',
                        border: `1px solid ${filters[key] ? '#228be6' : '#ddd'}`,
                        borderRadius: '3px'
                      }}
                  />
                  {filters[key] && (
                      <button
                          onClick={() => onRemoveFilter(key)}
                          style={{
                            position: 'absolute',
                            right: 5,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#666'
                          }}
                      >
                        ×
                      </button>
                  )}
                </div>
                <Title order={6} mb="md">{key}</Title>
              </div>
            </Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
);
