// Модальное окно входа
import {useState} from "react";
import {useAuth} from "@/providers/AuthProvider/AuthProvider";
import {Alert, Button, Modal, PasswordInput, Stack, TextInput} from "@mantine/core";

export function LoginModal({ opened, onClose }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const result = await login(credentials);
    if (result.success) {
      onClose();
      setCredentials({ username: '', password: '' });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setCredentials({ username: '', password: '' });
    setError('');
    onClose();
  };

  return (
      <Modal opened={opened} onClose={handleClose} title="Вход в систему" centered>
        <Stack>
          {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
          )}

          <TextInput
              label="Имя пользователя"
              placeholder="Введите имя пользователя"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({...prev, username: e.target.value}))}
              required
          />

          <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
              required
          />

          <Button onClick={handleSubmit} loading={loading} fullWidth>
            Войти
          </Button>
        </Stack>
      </Modal>
  );
}
