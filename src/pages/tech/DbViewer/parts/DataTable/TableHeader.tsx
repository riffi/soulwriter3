import { Table, Text, Select } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { Filters } from "@/pages/tech/DbViewer";
import { useMemo } from 'react';

interface TableHeaderProps {
  keys: string[];
  isPriorityField: (key: string) => boolean;
  filters: Filters;
  onAddFilter: (field: string, value: string) => void;
  onRemoveFilter: (field: string) => void;
  filterOptions: Record<string, string[]>;
  showFilters: boolean;
}

export const TableHeader = ({
                              keys,
                              filters,
                              onAddFilter,
                              onRemoveFilter,
                              filterOptions,
                              showFilters
                            }: TableHeaderProps) => {
  const selectStyles = useMemo(() => ({
    input: {
      border: `1px solid ${Object.keys(filters).length ? '#228be6' : '#ced4da'}`,
      fontSize: '13px'
    }
  }), [filters]);

  return (
      <Table.Thead>
        <Table.Tr>
          {keys.map((key) => (
              <Table.Th key={key} bg="#f8f9fa" style={{ border: '1px solid #dee2e6', minWidth: 50 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text fw={600} size="sm" mb={4}>{key}</Text>

                  {showFilters && (
                      <FilterSelect
                          value={filters[key]}
                          options={filterOptions[key] || []}
                          onChange={(value) =>
                              value ? onAddFilter(key, value) : onRemoveFilter(key)
                          }
                          styles={selectStyles}
                      />
                  )}
                </div>
              </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
  );
};

const FilterSelect = ({
                        value,
                        options,
                        onChange,
                        styles
                      }: {
  value?: string;
  options: string[];
  onChange: (value: string | null) => void;
  styles: React.CSSProperties;
}) => (
    <Select
        value={value || null}
        data={options}
        onChange={onChange}
        placeholder="Filter..."
        searchable
        clearable
        allowDeselect
        w="100%"
        styles={{ input: styles.input }}
    />
);
