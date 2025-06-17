import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { BaseLayout } from '@/components/layout/BaseLayout/BaseLayout';
import {ReactNode} from "react";
import {Configurator} from "@/pages/configurator/Configurator";
import {ConfigurationCard} from "@/pages/configurator/ConfigurationCard";
import {BlockCard} from "@/pages/configurator/BlockCard";
import {BooksPage} from "@/pages/books/BooksPage";
import {ScenesPage} from "@/pages/scenes/ScenesPage";
import {SceneCard} from "@/pages/scenes/SceneCard";
import {BlockInstanceManagerPage} from "@/pages/books/BlockInstanceManagerPage";
import {BlockInstancePage} from "@/pages/books/BlockInstancePage";
import {SettingsPage} from "@/pages/settings/SettingsPage";
import {NoteManager} from "@/components/notes/NoteManager/NoteManager";
import {NoteEditPage} from "@/components/notes/NoteEditPage/NoteEditPage";
import {NoteFolder} from "@/components/notes/NoteFolder/NoteFolder";
import {BookDashboardPage} from "@/pages/books/BookDashboardPage";
import {DbViewer} from "@/pages/tech/DbViewer";
import {BookReaderPage} from "@/pages/books/BookReaderPage";
import {SceneLayout} from "@/components/scenes/SceneLayout/SceneLayout";

const router = createBrowserRouter([
  {
    path: '/',
    element: <BaseLayout/> as ReactNode,
    children: [
      {
        path: '/configurator',
        element: <Configurator/> as ReactNode
      },
      {
        path: '/settings',
        element: <SettingsPage/> as ReactNode
      },
      {
        path: '/configuration/edit',
        element: <ConfigurationCard/> as ReactNode
      },
      {
        path: '/block/edit',
        element: <BlockCard/> as ReactNode
      },
      {
        index: true,
        element: <BooksPage/> as ReactNode
      },
      {
        path: '/book/dashboard',
        element: <BookDashboardPage/> as ReactNode
      },
      {
        path: '/scenes',
        element: <ScenesPage/> as ReactNode,
      },
      {
        path: '/scene/card',
        element: <SceneCard/> as ReactNode
      },
      {
        path: '/block-instance/manager',
        element: <BlockInstanceManagerPage/> as ReactNode
      },
      {
        path: '/block-instance/card',
        element: <BlockInstancePage/> as ReactNode
      },
      {
        path: '/notes',
        element: <NoteManager /> as ReactNode,
      },
      {
        path: '/book-notes',
        element: <NoteManager bookNotesMode={true} /> as ReactNode,
      },
      {
        path: '/notes/folder/:folderUuid',
        element: <NoteFolder /> as ReactNode,
      },
      {
        path: '/notes/new',
        element: <NoteEditPage /> as ReactNode
      },
      {
        path: '/notes/edit/:uuid',
        element: <NoteEditPage /> as ReactNode,
      },
      {
        path: '/db-viewer',
        element: <DbViewer /> as ReactNode,
      },
      {
        path: '/book/reader',
        element: <BookReaderPage /> as ReactNode,
      },
    ]
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
