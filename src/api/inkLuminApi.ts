// api/authAPI.ts
const API_BASE = 'https://api.inclumin.ru/api';

export const inkLuminAPI = {
  register: async (userData: any) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  login: async (credentials: any) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  validateToken: async (token: string) => {
    const response = await fetch(`${API_BASE}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  saveConfigData: async (token: string, configData: any) => {
    const response = await fetch(`${API_BASE}/user/config-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ configData: JSON.stringify(configData) }),
    });
    return response.json();
  },

  getConfigData: async (token: string) => {
    const response = await fetch(`${API_BASE}/user/config-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  }
};
