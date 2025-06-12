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
import { AuthProvider } from "@/providers/AuthProvider/AuthProvider"; // Removed useAuth as it's not used here
import {ReactFlowProvider} from "reactflow";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary"; // Added import
import { ConnectionStatusProvider } from '@/providers/ConnectionStatusProvider/ConnectionStatusProvider'; // Added import

export default function App() {

  return (
      <MantineProvider defaultColorScheme={"light"} datesLocale="ru">
        <Notifications /> {/* Moved Notifications outside ErrorBoundary for global error display */}
        <AuthProvider>
          <DialogProvider>
            <PageTitleProvider>
              <ErrorBoundary>
              <ConnectionStatusProvider> {/* Added ConnectionStatusProvider */}
                <ReactFlowProvider>
                  <MediaQueryProvider>
                    <Router />
                  </MediaQueryProvider>
                </ReactFlowProvider>
              </ConnectionStatusProvider> {/* Added ConnectionStatusProvider */}
              </ErrorBoundary>
            </PageTitleProvider>
          </DialogProvider>
        </AuthProvider>
      </MantineProvider>
  );
}
