import { request } from './base';

export const packagingService = {
  getAll: async () => {
    return await request('/api/packagings');
  },
  
  // Types
  createType: async (data: { name: string }) => {
    return await request('/api/packagings/types', { method: 'POST', body: JSON.stringify(data) });
  },
  updateType: async (id: number, data: { name: string }) => { // Baru
    return await request(`/api/packagings/types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteType: async (id: number) => {
    return await request(`/api/packagings/types/${id}`, { method: 'DELETE' });
  },

  // Sizes
  createSize: async (data: { type_id: number, size: string, price: number }) => {
    return await request('/api/packagings/sizes', { method: 'POST', body: JSON.stringify(data) });
  },
  updateSize: async (id: number, data: { size: string, price: number }) => { // Baru
    return await request(`/api/packagings/sizes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteSize: async (id: number) => {
    return await request(`/api/packagings/sizes/${id}`, { method: 'DELETE' });
  }
};