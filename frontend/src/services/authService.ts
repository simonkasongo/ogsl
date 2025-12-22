import axiosClient from '@/api/axiosClient';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/features/auth/types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/register/', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await axiosClient.get<User>('/auth/profile/');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosClient.post('/auth/logout/');
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await axiosClient.patch<User>('/auth/profile/', data);
    return response.data;
  },
};


