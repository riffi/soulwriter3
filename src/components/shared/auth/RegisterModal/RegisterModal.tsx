// Модальное окно регистрации
import {useState} from "react";
import {useAuth} from "@/providers/AuthProvider/AuthProvider";
import {Alert, Button, Modal, PasswordInput, Stack, TextInput} from "@mantine/core";

export function RegisterModal({ opened, onClose }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async () => {
    setError('');

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (formData.username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }

    setLoading(true);

    const result = await register(formData);
    if (result.success) {
      onClose();
      setFormData({ username: '', password: '', confirmPassword: '', displayName: '' });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setFormData({ username: '', password: '', confirmPassword: '', displayName: '' });
    setError('');
    onClose();
  };

  return (
      <Modal opened={opened} onClose={handleClose} title="Регистрация" centered>
        <Stack>
          {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
          )}

          <TextInput
              label="Имя пользователя"
              placeholder="Введите имя пользователя"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
              required
          />

          <TextInput
              label="Отображаемое имя"
              placeholder="Введите отображаемое имя (необязательно)"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({...prev, displayName: e.target.value}))}
          />

          <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              required
          />

          <PasswordInput
              label="Подтверждение пароля"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
              required
          />

          <Button onClick={handleSubmit} loading={loading} fullWidth>
            Зарегистрироваться
          </Button>
        </Stack>
      </Modal>
  );
}
