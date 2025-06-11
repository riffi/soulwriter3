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
import {AuthProvider, useAuth} from "@/providers/AuthProvider/AuthProvider";
import {ReactFlowProvider} from "reactflow";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary"; // Added import

export default function App() {

  return (
      <MantineProvider defaultColorScheme={"light"} datesLocale="ru">
        <Notifications /> {/* Moved Notifications outside ErrorBoundary for global error display */}
        <AuthProvider>
          <DialogProvider>
            <PageTitleProvider>
              <ErrorBoundary>
                <ReactFlowProvider>
                  <MediaQueryProvider>
                    <Router />
                  </MediaQueryProvider>
                </ReactFlowProvider>
              </ErrorBoundary>
            </PageTitleProvider>
          </DialogProvider>
        </AuthProvider>
      </MantineProvider>
  );
}
