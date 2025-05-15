import {
  IconBooks,
  IconBrandDatabricks,
  IconGauge,
  IconNotes,
  IconChevronRight, IconSettings, IconCell, IconBox, IconDatabaseCog, IconDashboard,
} from '@tabler/icons-react';
import {
  Box,
  Collapse,
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
  Code,
  ScrollArea,
  Space,
  Divider,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import { useBookStore } from '@/stores/bookStore/bookStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import {IBlock, IBlockStructureKind} from '@/entities/ConstructorEntities';
import classes from './NavbarNested.module.css';
import { Logo } from './Logo';
import { UserButton } from '../UserButton/UserButton';
import config from '../../../../package.json';
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";
interface NavLinkItem {
  label: string;
  link?: string;
  icon?: string;
}

interface NavLinkGroup {
  label: string;
  icon: React.FC<any>;
  initiallyOpened?: boolean;
  links?: NavLinkItem[];
  link?: string;
}

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

const BASE_MENU_ITEMS: NavLinkGroup[] = [
  {
    label: 'Общее',
    icon: IconBox,
    links:[
      {
        label: 'Конфигуратор',
        link: '/configurator',
      },
      {
        label: 'Заметки',
        link: '/notes',
      },
      {
        label: 'Книги',
        link: '/books',
      },
      {
        label: 'Настройки',
        link: '/settings',
      },
      {
        label: 'База данных',
        link: '/db-viewer',
      },
    ]
  },
];

const getBlockPageTitle = (block: IBlock) => {
  if (block.structureKind === IBlockStructureKind.single){
    return block.title;
  }
  else if (block.structureKind === IBlockStructureKind.multiple){
    return block.titleForms?.plural
  }
  else {
    return block.title
  }
}

export const NavbarNested = ({ toggleNavbar }: { toggleNavbar?: () => void }) => {
  const { selectedBook } = useBookStore();
  const blocks = useLiveQuery<IBlock[]>(() => {
    if (!bookDb) {return [];}
    return bookDb.blocks.toArray()
  }, [selectedBook]);

  const { baseItems, dynamicItems } = useMemo(() => {
    const baseItems = [...BASE_MENU_ITEMS];
    const dynamicItems: NavLinkGroup[] = [];

    if (selectedBook) {
      dynamicItems.push({
        label: 'Рабочий стол',
        icon: IconDashboard,
        initiallyOpened: true,
        link: '/book/dashboard',
      });

      dynamicItems.push({
        label: 'Сцены',
        icon: IconNotes,
        initiallyOpened: true,
        link: '/scenes',
      });
      dynamicItems.push({
        label: 'Чтение',
        icon: IconBooks,
        initiallyOpened: true,
        link: '/book/reader',
      });



      const knowledgeLinks = blocks?.filter(block => block.parentBlockUuid == null)
        ?.map((block) => ({
          label: getBlockPageTitle(block),
          icon: block.icon,
          link: `/block-instance/manager?uuid=${block.uuid}`,
        })) || [];

      if (knowledgeLinks.length > 0) {
        dynamicItems.push({
          label: 'База знаний',
          icon: IconBrandDatabricks,
          initiallyOpened: true,
          links: knowledgeLinks,
        });
      }

      dynamicItems.push({
        label: 'Конфигурация',
        icon: IconDatabaseCog,
        initiallyOpened: true,
        link: `/configuration/edit/?uuid=${selectedBook.configurationUuid}&bookUuid=${selectedBook.uuid}`,
      });
    }

    return { baseItems, dynamicItems };
  }, [selectedBook, blocks]);

  return (
      <nav className={classes.navbar} aria-label="Основное меню">
        <div className={classes.header}>
          <Group justify="space-between">
            <Logo style={{ width: 150 }} />
            <Code fw={700}>{config.version}</Code>
          </Group>
        </div>

        <ScrollArea className={classes.links}>
          <div className={classes.linksInner}>
            {baseItems.map((item) => (
                <NavLink
                    {...item}
                    key={item.label}
                    toggleNavbar={toggleNavbar}
                    isBaseItem // Активируем особый стиль
                />
            ))}
            <Divider my="sm" />
            {/* Добавьте блок с названием книги здесь */}
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
