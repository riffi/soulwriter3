import React, { useState, useRef, useEffect } from 'react';
import { TagsInput, Text, Box, Group, useMantineTheme, Badge, ActionIcon } from '@mantine/core';
import { Pencil, Check } from 'tabler-icons-react';

interface InlineTagEditProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  label?: string;
  placeholder?: string;
  editable?: boolean;
}

export const InlineTagEdit: React.FC<InlineTagEditProps> = ({
                                                              value,
                                                              onChange,
                                                              label = '',
                                                              placeholder = 'Клик для добавления',
                                                              editable = true,
                                                            }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const theme = useMantineTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentValueRef = useRef<string[]>(value);

  useEffect(() => {
    setEditValue(value);
    currentValueRef.current = value;
  }, [value]);

  const handleSave = () => {
    setIsEditing(false);
    onChange(currentValueRef.current);
  };

  const activateEdit = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  return (
      <Box>
        {label && (
            <Text size="sm" color="dimmed" mb={4}>
              {label}
            </Text>
        )}

        {!isEditing ? (
            <Group spacing="xs" noWrap align="center">
              <Box
                  onClick={activateEdit}
              >
                {editValue.length > 0 ? (
                    editValue.map((tag) => (
                        <Badge style={{ marginRight: theme.spacing.xs }} key={tag} variant="outline">
                          {tag}
                        </Badge>
                    ))
                ) : (
                    <Text color={theme.colors.gray[5]}>{placeholder}</Text>
                )}
              </Box>
              {editable && (
                  <Box
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                      onClick={activateEdit}
                  >
                    <Pencil size={16} color={theme.colors.gray[5]} />
                  </Box>
              )}
            </Group>
        ) : (
            <Group noWrap spacing="xs" align="flex-end">
              <TagsInput
                  ref={inputRef}
                  value={editValue}
                  onChange={(newValue) => {
                    setEditValue(newValue);
                    currentValueRef.current = newValue;
                  }}
                  onBlur={handleSave}
                  placeholder={placeholder}
                  styles={{
                    input: {
                      border: 'none',
                      borderBottom: `1px solid ${theme.colors.gray[4]}`,
                      borderRadius: 0,
                      '&:focus': {
                        borderBottom: `1px solid ${theme.colors.blue[6]}`,
                      },
                    },
                  }}
                  autoFocus
              />
              <ActionIcon
                  onClick={handleSave}
                  color="blue"
                  size="sm"
                  variant="subtle"
                  style={{ marginBottom: 4 }}
              >
                <Check size={16} />
              </ActionIcon>
            </Group>
        )}
      </Box>
  );
};
