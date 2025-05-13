// GameIconSelector.tsx
import React, { useState } from 'react';
import {
  Input,
  Grid,
  Box,
  Text,
  Divider,
  Group,
  Button,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import * as Gi from 'react-icons/gi'; // Импортируем весь модуль

// Динамическое создание списка иконок
const availableIcons = Object.keys(Gi)
.filter((key) => typeof Gi[key] === 'function' && key.startsWith('Gi'))
.map((name) => ({
  name,
  component: React.createElement(Gi[name], { size: 24 }),
}));

interface GameIconSelectorProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectIcon: (iconName: string) => void;
}

export const GameIconSelector = ({
                                   searchQuery,
                                   onSearchChange,
                                   onSelectIcon,
                                 }: GameIconSelectorProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Фильтрация иконок по поисковому запросу
  const filteredIcons = availableIcons.filter((icon) =>
      icon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Расчет количества страниц
  const totalPages = Math.ceil(filteredIcons.length / itemsPerPage);

  // Получение данных текущей страницы
  const paginatedIcons = filteredIcons.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  // Обработчики навигации
  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
      <div>
        {/* Поле поиска */}
        <Input
            placeholder="Поиск иконок"
            value={searchQuery}
            onChange={onSearchChange}
            icon={<IconSearch />}
            mb="md"
        />
        <Divider my="sm" />

        {/* Сетка иконок */}
        <Grid>
          {paginatedIcons.map((icon) => (
              <Grid.Col span={3} key={icon.name}>
                <Box
                    onClick={() => onSelectIcon(icon.name)}
                    style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  {icon.component}
                  <Text size="xs" mt={4}>
                    {icon.name}
                  </Text>
                </Box>
              </Grid.Col>
          ))}
        </Grid>

        {/* Пагинация */}
        {totalPages > 1 && (
            <Group mt="md" position="center">
              <Button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  size="xs"
                  variant="outline"
              >
                Назад
              </Button>
              <Text size="sm">
                Страница {currentPage} из {totalPages}
              </Text>
              <Button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  size="xs"
                  variant="outline"
              >
                Вперед
              </Button>
            </Group>
        )}
      </div>
  );
};
