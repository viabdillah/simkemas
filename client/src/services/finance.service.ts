import { request } from './base';

export const financeService = {
  getTransactions: async (start = '', end = '') => {
    let query = '';
    if (start && end) query = `?start=${start}&end=${end}`;
    return await request(`/api/finance${query}`);
  },

  // Update fungsi ini untuk menerima 'type'
  createTransaction: async (data: { type: 'in' | 'out', amount: number, description: string, category: string }) => {
    return await request('/api/finance/manual', { // Endpoint baru
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};