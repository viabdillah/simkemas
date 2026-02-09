import { request } from './base';

export const designService = {
  getQueue: async () => {
    return await request('/api/designs/queue');
  },
  
  updateStatus: async (id: number, status: string, note?: string) => {
    return await request(`/api/designs/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    });
  },

  getHistory: async () => {
    return await request('/api/designs/history');
  }
};