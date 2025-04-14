import {
  IconAdjustments,
  IconBooks,
  IconBrandDatabricks,
  IconCalendarStats,
  IconFileAnalytics,
  IconGauge,
  IconLock,
  IconNotes,
  IconPresentationAnalytics,
  IconChevronRight,
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
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useBookStore } from '@/stores/bookStore/bookStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import { IBlock } from '@/entities/ConstructorEntities';
import classes from './NavbarNested.module.css';
import { Logo } from './Logo';
import { UserButton } from '../UserButton/UserButton';

interface NavLinkProps {
  icon: React.FC<any>;
  label: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string }[];
  link?: string;
  toggleNavbar?: () => void;
}

function NavLink({ icon: Icon, label, initiallyOpened, links, link, toggleNavbar }: NavLinkProps) {
  const navigate = useNavigate();
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);

  const handleClick = () => {
    if (link) {
      navigate(link);
      toggleNavbar?.();
    } else {
      setOpened((o) => !o);
    }
  };

  const items = (hasLinks ? links : []).map((link) => (
      <Text<'a'>
          component="a"
          className={classes.link}
          href={link.link}
          key={link.label}
          onClick={(event) => {
            event.preventDefault();
            navigate(link.link);
            toggleNavbar?.();
          }}
      >
        {link.label}
      </Text>
  ));

  return (
      <>
        <UnstyledButton onClick={handleClick} className={classes.control}>
          <Group justify="space-between" gap={0}>
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon variant="light" size={30}>
                <Icon size={18} />
              </ThemeIcon>
              <Box ml="md">{label}</Box>
            </Box>
            {hasLinks && (
                <IconChevronRight
                    className={classes.chevron}
                    stroke={1.5}
                    size={16}
                    style={{ transform: opened ? 'rotate(-90deg)' : 'none' }}
                />
            )}
          </Group>
        </UnstyledButton>
        {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
      </>
  );
}

export function NavbarNested({ toggleNavbar }: { toggleNavbar?: () => void }) {
  const { selectedBook } = useBookStore();
  const blocks = useLiveQuery<IBlock[]>(() => bookDb.blocks.toArray(), [bookDb]);

  const menuData = [
    {
      label: 'Конфигуратор',
      icon: IconGauge,
      link: '/configurator',
    },
    {
      label: 'Книги',
      icon: IconBooks,
      link: '/books',
    },
  ];

  if (selectedBook) {
    menuData.push({
      label: 'Сцены',
      icon: IconNotes,
      initiallyOpened: true,
      link: '/scenes',
    });

    const knowledgeLinks =
        blocks?.map((block) => ({
          label: block.title,
          link: '/', // Замените на актуальный путь
        })) || [];

    menuData.push({
      label: 'База знаний',
      icon: IconBrandDatabricks,
      initiallyOpened: true,
      links: knowledgeLinks,
    });
  }

  const links = menuData.map((item) => (
      <NavLink
          {...item}
          key={item.label}
          toggleNavbar={toggleNavbar}
      />
  ));

  return (
      <nav className={classes.navbar}>
        <div className={classes.header}>
          <Group justify="space-between">
            <Logo style={{ width: 120 }} />
            <Code fw={700}>v3.1.2</Code>
          </Group>
          <Space h={20} />
          {selectedBook && (
              <Group gap="xs" align="center">
                <IconBooks
                    size={18}
                    style={{
                      color: 'var(--mantine-color-blue-6)',
                      marginRight: 'var(--mantine-spacing-xs)',
                    }}
                />
                <Text fw={700} truncate style={{ maxWidth: 180 }}>
                  {selectedBook.title}
                </Text>
              </Group>
          )}
        </div>
        <ScrollArea className={classes.links}>
          <div className={classes.linksInner}>{links}</div>
        </ScrollArea>
        <div className={classes.footer}>
          <UserButton />
        </div>
      </nav>
  );
}
