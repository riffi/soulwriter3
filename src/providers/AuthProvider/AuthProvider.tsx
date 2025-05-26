import React, { useState, useEffect, createContext, useContext } from 'react';
import { inkLuminAPI } from '@/api/inkLuminApi';
// Контекст для аутентификации
const AuthContext = createContext();

// Хук для использования контекста аутентификации
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Провайдер аутентификации
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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

  const validateStoredToken = async (token) => {
    try {
      const response = await inkLuminAPI.validateToken(token);
      if (response.success) {
        setUser({
          token: token,
          username: response.data.username,
          displayName: response.data.displayName || response.data.username,
          userId: response.data.userId
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

  const login = async (credentials) => {
    try {
      const response = await inkLuminAPI.login(credentials);
      if (response.success) {
        const userData = {
          token: response.data.token,
          username: response.data.username,
          displayName: response.data.displayName || response.data.username,
          userId: response.data.userId
        };
        setUser(userData);
        localStorage.setItem('authToken', response.data.token);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка соединения с сервером' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await inkLuminAPI.register(userData);
      if (response.success) {
        const userInfo = {
          token: response.data.token,
          username: response.data.username,
          displayName: response.data.displayName || response.data.username,
          userId: response.data.userId
        };
        setUser(userInfo);
        localStorage.setItem('authToken', response.data.token);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка соединения с сервером' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const saveConfigToServer = async (configData) => {
    if (!user?.token) {
      return { success: false, message: 'Пользователь не авторизован' };
    }

    try {
      const response = await inkLuminAPI.saveConfigData(user.token, configData);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка соединения с сервером' };
    }
  };

  const getConfigFromServer = async () => {
    if (!user?.token) {
      return { success: false, message: 'Пользователь не авторизован' };
    }

    try {
      const response = await inkLuminAPI.getConfigData(user.token);
      if (response.success) {
        const configData = JSON.parse(response.data.configData);
        return { success: true, data: configData };
      } else {
        return { success: false, message: response.message };
      }
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
