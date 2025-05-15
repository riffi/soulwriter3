import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';
import '@mantine/notifications/styles.css';
import {Notifications} from "@mantine/notifications";
import {DialogProvider} from "@/providers/DialogProvider/DialogProvider";
import {PageTitleProvider} from "@/providers/PageTitleProvider/PageTitleProvider";
import React from "react";
import {MediaQueryProvider} from "@/providers/MediaQueryProvider/MediaQueryProvider";

export default function App() {
  return (
    <MantineProvider defaultColorScheme={"light"} datesLocale="ru">
      <DialogProvider>
        <PageTitleProvider>
          <MediaQueryProvider>
            <Notifications />
            <Router />
          </MediaQueryProvider>
        </PageTitleProvider>
      </DialogProvider>
    </MantineProvider>
  );
}
