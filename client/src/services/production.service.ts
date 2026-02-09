import { request } from './base';

export const productionService = {
  getQueue: async () => {
    return await request('/api/production/queue');
  },
  
  // Update parameter di sini
  updateStatus: async (id: number, status: string, note?: string, materialsUsed?: any[], actualQuantity?: number) => {
    return await request(`/api/production/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note, materialsUsed, actualQuantity })
    });
  },

  getHistory: async () => {
    return await request('/api/production/history');
  }
};