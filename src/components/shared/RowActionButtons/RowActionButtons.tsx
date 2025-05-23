import {Group, ActionIcon, Drawer, Button, Stack, Box, Text} from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import React, { useState } from 'react';

export interface ActionItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  color?: string;
  variant?: string;
}

interface ActionButtonsProps {
  actions: ActionItem[];
  onAction: (actionKey: string) => void;
  entityId?: string;
  drawerTitle?: string;
}

export const RowActionButtons = ({
                                actions,
                                onAction,
                                entityId,
                                drawerTitle = "Действия"
                              }: ActionButtonsProps) => {
  const { isMobile } = useMedia();
  const [openedDrawerId, setOpenedDrawerId] = useState<string | null>(null);

  const handleDrawerAction = (actionKey: string) => {
    setOpenedDrawerId(null);
    onAction(actionKey);
  };

  const drawerId = entityId || 'default';

  return (
      <Group gap={4} justify="center">
        {isMobile ? (
            <>
              <ActionIcon
                  variant="subtle"
                  onClick={() => setOpenedDrawerId(drawerId)}
              >
                <IconDots size={16} />
              </ActionIcon>

              <Drawer
                  opened={openedDrawerId === drawerId}
                  onClose={() => setOpenedDrawerId(null)}
                  position="bottom"
                  title={drawerTitle}
                  size="25%"
              >
                <Stack gap="0">
                  {actions.map((action, index) => (
                      <Group
                          key={action.key}
                          gap="sm"
                          onClick={() => handleDrawerAction(action.key)}
                          style={{
                            cursor: "pointer",
                            paddingTop:'8px',
                            paddingBottom:'8px',
                            borderBottom: index < actions.length - 1 ? "1px solid rgba(0,0,0,0.0.1)" : "none",
                          }}
                      >
                        <ActionIcon
                          variant="subtle"
                          color={action.color}
                        >
                          {action.icon}
                        </ActionIcon>
                        <Text
                          size="lg"
                        >
                          {action.title}
                        </Text>
                      </Group>
                  ))}
                </Stack>
              </Drawer>
            </>
        ) : (
            <>
              {actions.map((action) => (
                  <ActionIcon
                      key={action.key}
                      variant="subtle"
                      color={action.color}
                      size={20}
                      onClick={() => onAction(action.key)}
                  >
                    {action.icon}
                  </ActionIcon>
              ))}
            </>
        )}
      </Group>
  );
};
