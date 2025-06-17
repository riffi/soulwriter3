import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  login as loginRequest,
  register as registerRequest,
  validateToken as validateTokenRequest,
  saveConfigToServer as saveConfigRequest,
  getConfigFromServer as getConfigRequest,
  ServiceResult,
} from '@/services/authService';

interface User {
  token: string;
  username: string;
  displayName: string;
  userId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<ServiceResult>;
  register: (userData: any) => Promise<ServiceResult>;
  logout: () => void;
  saveConfigToServer: (configData: any) => Promise<ServiceResult>;
  getConfigFromServer: () => Promise<ServiceResult>;
}

// Контекст для аутентификации
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Хук для использования контекста аутентификации
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Провайдер аутентификации
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверка токена при загрузке приложения
    const token = localStorage.getItem('authToken');
    if (token) {
      validateStoredToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateStoredToken = async (token: string) => {
    try {
      const response = await validateTokenRequest(token);
      if (response.success && response.data) {
        setUser({
          token,
          username: response.data.username,
          displayName: response.data.displayName || response.data.username,
          userId: response.data.userId,
        });
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any): Promise<ServiceResult> => {
    try {
      const response = await loginRequest(credentials);
      if (response.success && response.data) {
        const userData = {
          token: response.data.token,
          username: response.data.username,
          displayName: response.data.displayName || response.data.username,
          userId: response.data.userId
        };
        setUser(userData);
        localStorage.setItem('authToken', response.data.token);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Ошибка соединения с сервером' };
    }
  };

  const register = async (userData: any): Promise<ServiceResult> => {
    try {
      const response = await registerRequest(userData);
      if (response.success && response.data) {
        const userInfo = {
          token: response.data.token,
          username: response.data.username,
          displayName: response.data.displayName || response.data.username,
          userId: response.data.userId
        };
        setUser(userInfo);
        localStorage.setItem('authToken', response.data.token);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Ошибка соединения с сервером' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const saveConfigToServer = async (configData: any): Promise<ServiceResult> => {
    if (!user?.token) {
      return { success: false, message: 'Пользователь не авторизован' };
    }

    try {
      return await saveConfigRequest(user.token, configData);
    } catch (error) {
      return { success: false, message: 'Ошибка соединения с сервером' };
    }
  };

  const getConfigFromServer = async (): Promise<ServiceResult> => {
    if (!user?.token) {
      return { success: false, message: 'Пользователь не авторизован' };
    }

    try {
      return await getConfigRequest(user.token);
    } catch (error) {
      return { success: false, message: 'Ошибка соединения с сервером' };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    saveConfigToServer,
    getConfigFromServer
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}
