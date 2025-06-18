import React, { useMemo } from 'react'; // Removed useState
import { useBookStore } from '@/stores/bookStore/bookStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import {IBlock, IBlockStructureKind, IBookConfiguration, IIcon} from '@/entities/ConstructorEntities';
import {
  IconBooks,
  IconBox,
  IconBrandDatabricks,
  IconDashboard, IconDatabaseCog, IconGraph,
  IconNotes,
  IconBulb // Added IconBulb
} from "@tabler/icons-react";
import {CollapsedNavbar} from "@/components/layout/NavbarNested/parts/CollapsedNavbar/CollapsedNavbar";
import {ExpandedNavbar} from "@/components/layout/NavbarNested/parts/ExpandedNavbar/ExpandedNavbar";
import { useNavigate } from "react-router-dom"; // Added useNavigate
import { useConnection } from '@/providers/ConnectionStatusProvider/ConnectionStatusProvider';
import {useUiSettingsStore} from "@/stores/uiSettingsStore/uiSettingsStore"; // Added import

export interface NavLinkItem {
  label: string;
  link?: string;
  icon?: IIcon;
}

export interface NavLinkGroup {
  label: string;
  icon: React.FC<any>;
  initiallyOpened?: boolean;
  links?: NavLinkItem[];
  link?: string;
  onClick?: () => Promise<void>; // Added onClick handler
}

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
        link: '/',
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
  if (block.structureKind === IBlockStructureKind.single) {
    return block.title;
  }
  return block.titleForms?.plural || block.title;
};

export const NavbarNested = ({ toggleNavbar, opened }: { toggleNavbar?: () => void; opened: boolean }) => {
  const { selectedBook } = useBookStore();
  const navigate = useNavigate(); // Hook for navigation
  const { isOnline } = useConnection(); // Get connection status
  const { chapterOnlyMode } = useUiSettingsStore();

  const handleQuickNoteClick = React.useCallback(() => { // Wrapped with useCallback
    navigate('/notes/new');
  }, [navigate]);

  const blocks = useLiveQuery<IBlock[]>(() => {
    return selectedBook ? bookDb.blocks.toArray() : [];
  }, [selectedBook]);

  const bookConfiguration = useLiveQuery<IBookConfiguration>(async () => {
    return selectedBook ? bookDb.bookConfigurations.toCollection().first() : null;
  }, [selectedBook]);

  const { baseItems, dynamicItems } = useMemo(() => {
    const quickNoteItem: NavLinkGroup = {
      label: 'Быстрая заметка',
      icon: IconBulb,
      onClick: handleQuickNoteClick, // This function reference is now stable
    };
    let dynamicItems: NavLinkGroup[] = [];

    if (selectedBook) {
      const allDynamicItems: NavLinkGroup[] = [
        { label: 'Рабочий стол', icon: IconDashboard, link: '/book/dashboard' },
        { label: chapterOnlyMode ?'Главы' : 'Сцены', icon: IconNotes, link: '/scenes' },
        { label: 'Заметки книги', icon: IconGraph, link: '/book-notes' },
        { label: 'Чтение', icon: IconBooks, link: '/book/reader' },
        {
          label: 'База знаний',
          icon: IconBrandDatabricks,
          links: blocks?.filter(b => !b.parentBlockUuid && b.showInMainMenu === 1).map(b => ({
            label: getBlockPageTitle(b),
            icon: b.icon,
            link: `/block-instance/manager?uuid=${b.uuid}`
          })) || []
        },
        {
          label: 'Конфигурация',
          icon: IconDatabaseCog,
          link: `/configuration/edit/?uuid=${bookConfiguration?.uuid}&bookUuid=${selectedBook.uuid}`
        },
      ];

      if (selectedBook.kind === 'material') {
        dynamicItems = allDynamicItems.filter(item => item.label !== 'Чтение' && item.label !== 'Сцены');
      } else {
        dynamicItems = allDynamicItems;
      }
    }

    return {
      baseItems: [quickNoteItem, ...BASE_MENU_ITEMS], // Prepend quick note item
      dynamicItems
    };
  }, [selectedBook, blocks, handleQuickNoteClick]); // Added handleQuickNoteClick back

  if (!opened) {
    return <CollapsedNavbar
        opened={opened}
        toggleNavbar={toggleNavbar}
        baseItems={baseItems}
        dynamicItems={dynamicItems}
        isOnline={isOnline} // Pass isOnline
    />;
  }

  return <ExpandedNavbar
      opened={opened}
      toggleNavbar={toggleNavbar}
      baseItems={baseItems}
      dynamicItems={dynamicItems}
      isOnline={isOnline} // Pass isOnline
  />;
};
