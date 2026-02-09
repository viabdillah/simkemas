import { request } from './base';

export const inventoryService = {
  getStocks: async () => { return await request('/api/inventory/stocks'); },
  // Ubah product_id jadi item_id
  updateStock: async (data: { item_id: number, type: 'in' | 'out' | 'opname', quantity: number, note: string }) => {
    return await request('/api/inventory/update', { method: 'POST', body: JSON.stringify(data) });
  },
  getLogs: async () => { return await request('/api/inventory/logs'); }
};