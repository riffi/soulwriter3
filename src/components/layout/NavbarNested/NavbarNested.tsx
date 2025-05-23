import React, { useState, useMemo } from 'react';
import { useBookStore } from '@/stores/bookStore/bookStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import {IBlock, IBlockStructureKind, IIcon} from '@/entities/ConstructorEntities';
import {
  IconBooks,
  IconBox,
  IconBrandDatabricks,
  IconDashboard, IconDatabaseCog,
  IconNotes
} from "@tabler/icons-react";
import {CollapsedNavbar} from "@/components/layout/NavbarNested/parts/CollapsedNavbar/CollapsedNavbar";
import {ExpandedNavbar} from "@/components/layout/NavbarNested/parts/ExpandedNavbar/ExpandedNavbar";

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
  if (block.structureKind === IBlockStructureKind.single) {
    return block.title;
  }
  return block.titleForms?.plural || block.title;
};

export const NavbarNested = ({ toggleNavbar, opened }: { toggleNavbar?: () => void; opened: boolean }) => {
  const { selectedBook } = useBookStore();

  const blocks = useLiveQuery<IBlock[]>(() => {
    return selectedBook ? bookDb.blocks.toArray() : [];
  }, [selectedBook]);

  const { baseItems, dynamicItems } = useMemo(() => {
    const dynamicItems: NavLinkGroup[] = [];

    if (selectedBook) {
      dynamicItems.push(
          { label: 'Рабочий стол', icon: IconDashboard, link: '/book/dashboard' },
          { label: 'Сцены', icon: IconNotes, link: '/scenes' },
          { label: 'Чтение', icon: IconBooks, link: '/book/reader' },
          {
            label: 'База знаний',
            icon: IconBrandDatabricks,
            links: blocks?.filter(b => !b.parentBlockUuid).map(b => ({
              label: getBlockPageTitle(b),
              icon: b.icon,
              link: `/block-instance/manager?uuid=${b.uuid}`
            })) || []
          },
          {
            label: 'Конфигурация',
            icon: IconDatabaseCog,
            link: `/configuration/edit/?uuid=${selectedBook.configurationUuid}&bookUuid=${selectedBook.uuid}`
          }
      );
    }

    return {
      baseItems: BASE_MENU_ITEMS,
      dynamicItems
    };
  }, [selectedBook, blocks]);

  if (!opened) {
    return <CollapsedNavbar
        opened={opened}
        toggleNavbar={toggleNavbar}
        baseItems={baseItems}
        dynamicItems={dynamicItems}
    />;
  }

  return <ExpandedNavbar
      opened={opened}
      toggleNavbar={toggleNavbar}
      baseItems={baseItems}
      dynamicItems={dynamicItems}
  />;
};
