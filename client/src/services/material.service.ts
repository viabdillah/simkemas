import { request } from './base';

export const materialService = {
  getAll: async () => { return await request('/api/materials'); },
  
  createMaterial: async (data: { name: string }) => {
    return await request('/api/materials', { method: 'POST', body: JSON.stringify(data) });
  },
  updateMaterial: async (id: number, data: { name: string }) => { // Baru
    return await request(`/api/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteMaterial: async (id: number) => {
    return await request(`/api/materials/${id}`, { method: 'DELETE' });
  },

  createItem: async (data: { material_id: number, name: string, unit: string }) => {
    return await request('/api/materials/items', { method: 'POST', body: JSON.stringify(data) });
  },
  updateItem: async (id: number, data: { name: string, unit: string }) => { // Baru
    return await request(`/api/materials/items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteItem: async (id: number) => {
    return await request(`/api/materials/items/${id}`, { method: 'DELETE' });
  }
};