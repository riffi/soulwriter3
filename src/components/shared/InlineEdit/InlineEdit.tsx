import React, { useState, useRef, useEffect } from 'react';
import { TextInput, Text, Box, Group, useMantineTheme, Textarea } from '@mantine/core';
import { Pencil } from 'tabler-icons-react';

interface InlineEditProps {
    value: string;
    onChange: (newValue: string) => void;
    label?: string;
    placeholder?: string;
    textProps?: React.ComponentProps<typeof Text>;
    inputProps?: React.ComponentProps<typeof TextInput & typeof Textarea>; // Allow props for both
    editable?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    isTextarea?: boolean;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
                                                          value,
                                                          onChange,
                                                          label = '',
                                                          placeholder = 'Нажмите, чтобы редактировать',
                                                          textProps,
                                                          inputProps,
                                                          editable = true,
                                                          size,
                                                          isTextarea = false,
                                                      }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
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
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            cursor: editable ? 'pointer' : 'default',
                            maxWidth: '100%', // Ограничиваем максимальную ширину контейнером
                            '&:hover': {
                                opacity: editable ? 0.8 : 1,
                            },
                        }}
                        onClick={activateEdit}
                    >
                        <Text size={size} {...textProps}>
                            {value || <span style={{ color: theme.colors.gray[5] }}>{placeholder}</span>}
                        </Text>
                    </Box>
                    {editable && (
                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%',
                                cursor: 'pointer',
                                flexShrink: 0, // Предотвращаем сжатие иконки
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
                <Group align="center">
                    <Box style={{
                    }}>
                        {isTextarea ? (
                            <Textarea
                                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                                value={editValue}
                                onChange={(e) => setEditValue(e.currentTarget.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                size={size}
                                autosize
                                minRows={1}
                                styles={{
                                    root: {
                                        width: editValue.length > 30 ? '100%' : 'auto', // Полная ширина только для длинного текста
                                        minWidth: '100px' // Минимальная ширина для коротких текстов
                                    },
                                    input: {
                                        width: '100%',
                                        padding: theme.spacing.xs,
                                        border: 'none',
                                        borderBottom: `1px solid ${theme.colors.gray[4]}`,
                                        borderRadius: 0,
                                        '&:focus': {
                                            borderBottom: `1px solid ${theme.colors.blue[6]}`,
                                        },
                                    },
                                }}
                                {...inputProps}
                            />
                        ) : (
                            <TextInput
                                ref={inputRef as React.RefObject<HTMLInputElement>}
                                value={editValue}
                                onChange={(e) => setEditValue(e.currentTarget.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                size={size}
                                styles={{
                                    root: {
                                        width: editValue.length > 10 ? '100%' : 'auto', // Полная ширина для длинного текста
                                        minWidth: '300px' // Минимальная ширина для коротких текстов
                                    },
                                       input: {
                                        minWidth: '100%', // Занимаем всю ширину родителя
                                        height: 'auto',
                                        border: 'none',
                                        borderBottom: `1px solid ${theme.colors.gray[4]}`,
                                        borderRadius: 0,
                                        '&:focus': {
                                            borderBottom: `1px solid ${theme.colors.blue[6]}`,
                                        },
                                    },
                                }}
                                {...inputProps}
                            />
                        )}
                    </Box>
                </Group>
            )}
        </Box>
    );
};