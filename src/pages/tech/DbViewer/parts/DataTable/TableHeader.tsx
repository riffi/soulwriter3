import {ActionIcon, Select, Table, Text, TextInput, Title} from '@mantine/core';
import {Filters} from "@/pages/tech/DbViewer";
import {IconX} from "@tabler/icons-react";

interface TableHeaderProps {
  keys: string[];
  isPriorityField: (key: string) => boolean;
  filters: Filters;
  onAddFilter: (field: string, value: string) => void;
  onRemoveFilter: (field: string) => void;
  filterOptions: Record<string, string[]>;
  showFilters: boolean;
}

export const TableHeader = ({ keys, isPriorityField, filters, onAddFilter, onRemoveFilter, filterOptions, showFilters }: TableHeaderProps) => (
    <Table.Thead>
      <Table.Tr>
        {keys.map((key) => (
            <Table.Th key={key} style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              minWidth: '50px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text fw={600} size="sm" mb={4}>{key}</Text>

                {showFilters && (
                    <div style={{ position: 'relative' }}>
                      <Select
                          data={filterOptions[key] || []}
                          value={filters[key] || null}
                          onChange={(value) => {
                            if (value === null) {
                              onRemoveFilter(key);
                            } else if (value) {
                              onAddFilter(key, value);
                            }
                          }}
                          placeholder="Filter..."
                          searchable
                          clearable
                          style={{ width: '100%' }}
                          styles={{
                            input: {
                              border: `1px solid ${filters[key] ? '#228be6' : '#ced4da'}`,
                              fontSize: '13px'
                            }
                          }}
                      />
                    </div>
                )}
              </div>
            </Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
);
