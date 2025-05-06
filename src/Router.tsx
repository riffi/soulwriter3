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
import SettingsPage from "@/pages/settings/SettingsPage";

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
        path: '/books',
        element: <BooksPage/> as ReactNode
      },
      {
        path: '/scenes',
        element: <ScenesPage/> as ReactNode
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

    ]
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
