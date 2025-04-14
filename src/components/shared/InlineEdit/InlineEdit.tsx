import React, { useState, useRef, useEffect } from 'react';
import { TextInput, Text, Box, Group, useMantineTheme } from '@mantine/core';
import { Pencil } from 'tabler-icons-react';

interface InlineEditProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  placeholder?: string;
  textProps?: React.ComponentProps<typeof Text>;
  inputProps?: React.ComponentProps<typeof TextInput>;
  editable?: boolean;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
                                                        value,
                                                        onChange,
                                                        label = '',
                                                        placeholder = 'Click to edit',
                                                        textProps,
                                                        inputProps,
                                                        editable = true,
                                                      }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useMantineTheme();

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
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
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: editable ? 'pointer' : 'default',
                    '&:hover': {
                      opacity: editable ? 0.8 : 1,
                    },
                  }}
                  onClick={activateEdit}
              >
                <Text {...textProps}>
                  {value || <span style={{ color: theme.colors.gray[5] }}>{placeholder}</span>}
                </Text>
              </Box>
              {editable && (
                  <Box
                      sx={{
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
            <TextInput
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.currentTarget.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                styles={{
                  input: {
                    padding: theme.spacing.xs,
                    height: 'auto',
                    minHeight: '1.5rem',
                  },
                }}
                {...inputProps}
            />
        )}
      </Box>
  );
};
