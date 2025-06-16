import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
// import { theme } from './theme'; // Removed as it's not used in the provided App.tsx
import { Router } from './Router';
import '@mantine/notifications/styles.css';
import {Notifications} from "@mantine/notifications";
import {DialogProvider} from "@/providers/DialogProvider/DialogProvider";
import {PageTitleProvider} from "@/providers/PageTitleProvider/PageTitleProvider";
import React from "react";
import {MediaQueryProvider} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider/AuthProvider"; // Added useAuth
import {ReactFlowProvider} from "reactflow";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";
import { ConnectionStatusProvider } from '@/providers/ConnectionStatusProvider/ConnectionStatusProvider';
import { useServerSync } from '@/services/bookSyncService';

function AppContent() {
    const { user } = useAuth();
    useServerSync(user?.token);

    return (
        <MantineProvider defaultColorScheme={"light"} datesLocale="ru">
            <Notifications />
            <DialogProvider>
                <PageTitleProvider>
                    <ErrorBoundary>
                        <ConnectionStatusProvider>
                            <ReactFlowProvider>
                                <MediaQueryProvider>
                                    <Router />
                                </MediaQueryProvider>
                            </ReactFlowProvider>
                        </ConnectionStatusProvider>
                    </ErrorBoundary>
                </PageTitleProvider>
            </DialogProvider>
        </MantineProvider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
