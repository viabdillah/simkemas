// client/src/services/auth.service.ts
import { request } from './base';

export const authService = {
  login: async (credentials: any) => {
    return await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe: async () => {
    return await request('/api/auth/me', {
      method: 'GET',
    });
  },
};