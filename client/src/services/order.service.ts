import { request } from './base';

export const orderService = {
  getOrders: async (search = '') => {
    return await request(`/api/orders?search=${search}`);
  },
  
  getOrderById: async (id: string | number) => {
    return await request(`/api/orders/${id}`);
  },

  createOrder: async (data: any) => {
    return await request('/api/orders', { method: 'POST', body: JSON.stringify(data) });
  }
};