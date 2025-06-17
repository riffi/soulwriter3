import { inkLuminAPI } from '@/api/inkLuminApi';

export interface ServiceResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export const login = async (credentials: any): Promise<ServiceResult> => {
  try {
    const response = await inkLuminAPI.login(credentials);
    return response;
  } catch (error) {
    return { success: false, message: 'Ошибка соединения с сервером' };
  }
};

export const register = async (userData: any): Promise<ServiceResult> => {
  try {
    const response = await inkLuminAPI.register(userData);
    return response;
  } catch (error) {
    return { success: false, message: 'Ошибка соединения с сервером' };
  }
};

export const validateToken = async (token: string): Promise<ServiceResult> => {
  try {
    const response = await inkLuminAPI.validateToken(token);
    return response;
  } catch (error) {
    return { success: false, message: 'Ошибка соединения с сервером' };
  }
};

export const saveConfigToServer = async (
  token: string,
  configData: any
): Promise<ServiceResult> => {
  try {
    const response = await inkLuminAPI.saveConfigData(token, configData);
    return response;
  } catch (error) {
    return { success: false, message: 'Ошибка соединения с сервером' };
  }
};

export const getConfigFromServer = async (
  token: string
): Promise<ServiceResult> => {
  try {
    const response = await inkLuminAPI.getConfigData(token);
    if (response.success) {
      const configData = JSON.parse(response.data.configData);
      return { success: true, data: configData };
    }
    return { success: false, message: response.message };
  } catch (error) {
    return { success: false, message: 'Ошибка соединения с сервером' };
  }
};
