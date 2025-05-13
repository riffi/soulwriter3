import React from 'react';
import * as Gi from 'react-icons/gi';
import { Box, Text } from '@mantine/core';

interface IconViewerProps {
  iconName?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: React.CSSProperties; // Добавляем пропс для стилей
}

export const IconViewer = ({ iconName, size = 24, color = 'black', backgroundColor='#fff', style }: IconViewerProps) => {
  if (!iconName) return null;

  const combinedStyle = {
    color,
    backgroundColor,
    padding: `3px 5px`,
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style, // Переданные стили перезаписывают базовые
  };

  const IconComponent = Gi[iconName as keyof typeof Gi];

  return (
      <Box style={combinedStyle}>
        {IconComponent ? (
            <>
              {React.createElement(IconComponent, { size })}
            </>
        ) : (
            <></>
        )}
      </Box>
  );
};
