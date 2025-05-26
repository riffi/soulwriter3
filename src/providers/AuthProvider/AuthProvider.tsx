import React, { useState, useEffect, createContext, useContext } from 'react';

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

// API функции
const API_BASE = 'http://localhost:8080/api';

const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  validateToken: async (token) => {
    const response = await fetch(`${API_BASE}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  }
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
      const response = await authAPI.validateToken(token);
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
      const response = await authAPI.login(credentials);
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
      const response = await authAPI.register(userData);
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

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}
