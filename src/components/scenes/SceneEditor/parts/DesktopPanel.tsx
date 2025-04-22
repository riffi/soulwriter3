import { Paper } from "@mantine/core";

export const DesktopPanel = ({ children }: { children: React.ReactNode }) => (
    <Paper withBorder p="lg" radius="md" shadow="sm">
      {children}
    </Paper>
);
