import {useAuth} from "@/providers/AuthProvider/AuthProvider";
import {ReactNode, useState} from "react";
import {Avatar, Box, Button, Group, Modal, Stack, UnstyledButton, Text} from "@mantine/core";
import {IconChevronRight, IconLogin, IconUser, IconUserPlus} from "@tabler/icons-react";
import {LoginModal} from "@/components/shared/auth/LoginModal/LoginModal";
import {RegisterModal} from "@/components/shared/auth/RegisterModal/RegisterModal";


export function UserButton() {
  const { user, logout } = useAuth();
  const [loginModalOpened, setLoginModalOpened] = useState(false);
  const [registerModalOpened, setRegisterModalOpened] = useState(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);

  if (!user) {
    return (
        <>
          <Box style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <Button
                variant="subtle"
                leftSection={<IconLogin size={16} />}
                onClick={() => setLoginModalOpened(true)}
                compact
            >
              Войти
            </Button>
            <Button
                variant="filled"
                leftSection={<IconUserPlus size={16} />}
                onClick={() => setRegisterModalOpened(true)}
                compact
            >
              Регистрация
            </Button>
          </Box>

          <LoginModal
              opened={loginModalOpened}
              onClose={() => setLoginModalOpened(false)}
          />
          <RegisterModal
              opened={registerModalOpened}
              onClose={() => setRegisterModalOpened(false)}
          />
        </>
    );
  }

  return (
      <>
        <UnstyledButton
            onClick={() => setUserMenuOpened(true)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#f8f9fa'
              }
            }}
        >
          <Group>
            <Avatar
                src={null}
                radius="xl"
                color="blue"
            >
              <IconUser size={20} />
            </Avatar>

            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                {user.displayName}
              </Text>

              <Text c="dimmed" size="xs">
                @{user.username}
              </Text>
            </div>

            <IconChevronRight size={14} stroke={1.5} />
          </Group>
        </UnstyledButton>

        <Modal
            opened={userMenuOpened}
            onClose={() => setUserMenuOpened(false)}
            title="Профиль пользователя"
            centered
        >
          <Stack>
            <Group>
              <Avatar
                  src={null}
                  radius="xl"
                  color="blue"
                  size="lg"
              >
                <IconUser size={24} />
              </Avatar>
              <div>
                <Text size="lg" fw={500}>
                  {user.displayName}
                </Text>
                <Text c="dimmed" size="sm">
                  @{user.username}
                </Text>
              </div>
            </Group>

            <Button
                variant="light"
                color="red"
                onClick={() => {
                  logout();
                  setUserMenuOpened(false);
                }}
                fullWidth
            >
              Выйти
            </Button>
          </Stack>
        </Modal>
      </>
  );
}
