// ExpandedNavbar.tsx
import {
  Code,
  Group,
  ScrollArea,
  Divider,
  Box,
  Burger, UnstyledButton, ThemeIcon, Collapse, Text
} from '@mantine/core';
import { useBookStore } from '@/stores/bookStore/bookStore';
import {IconBooks, IconChevronRight} from '@tabler/icons-react';
import classes from '../NavbarNested.module.css';
import config from '../../../../../package.json';
import {UserButton} from "@/components/layout/UserButton/UserButton";
import {NavLinkGroup} from "@/components/layout/NavbarNested/NavbarNested";
import {useNavigate} from "react-router-dom";
import {useMemo, useState} from "react";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";
import {Logo} from "@/components/layout/NavbarNested/Logo";


interface NavLinkProps extends NavLinkGroup {
  toggleNavbar?: () => void;
  isBaseItem?: boolean; // Новый пропс для стилизации
}
const NavLink = ({
                   icon: Icon,
                   label,
                   initiallyOpened = false,
                   links,
                   link,
                   toggleNavbar,
                   isBaseItem = false // Значение по умолчанию
                 }: NavLinkProps) => {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(initiallyOpened);
  const hasLinks = links && links.length > 0;

  const handleClick = () => {
    if (link) {
      navigate(link);
      toggleNavbar?.();
    } else if (hasLinks) {
      setOpened((prev) => !prev);
    }
  };

  const linkItems = useMemo(() => (
      hasLinks ? links.map((item) => (
          <>
            <Text<'a'>
                component="a"
                flex={4}
                href={item.link}
                key={item.label}
                className={classes.link}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.link || '#');
                  toggleNavbar?.();
                }}
            >
              <Group justify="flex-start" gap={0}>
                <IconViewer
                    iconName={item.icon}
                    size={20}
                    color="var(--mantine-color-blue-7)"

                />
                <div style={{marginLeft: "10px"}}>
                  {item.label}
                </div>
              </Group>
            </Text>
          </>
      )) : null
  ), [hasLinks, links, navigate, toggleNavbar]);

  return (
      <>
        <UnstyledButton
            onClick={handleClick}
            className={isBaseItem ? classes.baseControl : classes.control} // Разные стили
            aria-expanded={hasLinks ? opened : undefined}
        >
          <Group justify="space-between" gap={0}>
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon
                  variant={isBaseItem ? 'filled' : 'light'} // Разные варианты иконок
                  size={30}
                  color={isBaseItem ? 'blue' : undefined}
              >
                <Icon size={18} />
              </ThemeIcon>
              <Box ml="md" fw={isBaseItem ? 700 : 500}> {/* Разная толщина текста */}
                {label}
              </Box>
            </Box>
            {hasLinks && (
                <IconChevronRight
                    className={classes.chevron}
                    stroke={1.5}
                    size={16}
                    style={{
                      transform: opened ? 'rotate(-90deg)' : 'none',
                      transition: 'transform 200ms ease'
                    }}
                />
            )}
          </Group>
        </UnstyledButton>
        {hasLinks && (
            <Collapse in={opened} transitionDuration={200}>
              {linkItems}
            </Collapse>
        )}
      </>
  );
};

export const ExpandedNavbar = ({
                                 opened,
                                 toggleNavbar,
                                 baseItems,
                                 dynamicItems
                               }: {
  opened: boolean;
  toggleNavbar?: () => void;
  baseItems: NavLinkGroup[];
  dynamicItems: NavLinkGroup[];
}) => {
  const { selectedBook } = useBookStore();

  return (
      <nav className={classes.navbar} aria-label="Основное меню">
        <div className={classes.header}>
          <Group justify="space-between">
            <Logo style={{ width: 150 }} />
            <Burger
                opened={opened}
                onClick={toggleNavbar}
                visibleFrom="sm"
                lineSize={1}
                size="lg"
            />
            <Code fw={700}>{config.version}</Code>
          </Group>
        </div>

        <ScrollArea className={classes.links}>
          <div className={classes.linksInner}>
            {baseItems.map((item) => (
                <NavLink
                    {...item}
                    key={item.label}
                    isBaseItem
                />
            ))}
            <Divider my="sm" />
            {selectedBook && (
                <Box px="md" py="sm">
                  <Group gap="xs" align="center">
                    <IconBooks
                        size={18}
                        color="var(--mantine-color-blue-6)"
                        style={{ marginRight: "var(--mantine-spacing-xs)" }}
                    />
                    <Text fw={700} truncate style={{ maxWidth: 180 }}>
                      {selectedBook.title}
                    </Text>
                  </Group>
                </Box>
            )}
            {dynamicItems.map((item) => (
                <NavLink
                    {...item}
                    key={item.label}
                    toggleNavbar={toggleNavbar}
                />
            ))}
          </div>
        </ScrollArea>

        <div className={classes.footer}>
          <UserButton />
        </div>
      </nav>
  );
};
