import React from 'react';
import * as Gi from 'react-icons/gi';
import { Box, Text, Image as MantineImage } from '@mantine/core';
import {IIcon, IIconKind} from "@/entities/ConstructorEntities";

interface IconViewerProps {
  icon?: IIcon;
  iconName?: string;
  customIconBase64?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: React.CSSProperties; // Добавляем пропс для стилей
}

export const IconViewer = ({ iconName, icon, customIconBase64, size = 24, color = 'black', backgroundColor='#fff', style }: IconViewerProps) => {
  if (!iconName && !customIconBase64 && !icon) return null;

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

  const IconComponent = icon
      ? icon.iconKind === 'gameIcons'
          ? Gi[icon.iconName]
          : null
      : Gi[iconName];

  if (icon?.iconKind === IIconKind.custom) {
    return (
        <Box>
          <MantineImage
              src={icon?.iconBase64}
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
