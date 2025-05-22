import React from 'react';
import * as Gi from 'react-icons/gi';
import { Box, Text, Image as MantineImage } from '@mantine/core';

interface IconViewerProps {
  iconName?: string;
  customIconBase64?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: React.CSSProperties; // Добавляем пропс для стилей
}

export const IconViewer = ({ iconName, customIconBase64, size = 24, color = 'black', backgroundColor='#fff', style }: IconViewerProps) => {
  if (!iconName && !customIconBase64) return null;

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

  if (customIconBase64) {
    return (
        <Box>
          <MantineImage
              src={customIconBase64}
              alt="Пользовательская иконка"
              style={{
                width: `${size+10}px`,
              }}
              radius="sm"
          />
        </Box>
    )
  }

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
