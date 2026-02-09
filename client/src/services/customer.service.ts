// client/src/services/customer.service.ts
import { request } from './base';

export const customerService = {
  getCustomers: async (search = '', deleted = false) => {
    return await request(`/api/customers?search=${search}&deleted=${deleted}`);
  },
  
  createCustomer: async (data: any) => {
    return await request('/api/customers', { method: 'POST', body: JSON.stringify(data) });
  },

  updateCustomer: async (id: number, data: any) => {
    return await request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteCustomer: async (id: number) => {
    return await request(`/api/customers/${id}`, { method: 'DELETE' });
  },

  restoreCustomer: async (id: number) => {
    return await request(`/api/customers/${id}/restore`, { method: 'POST' });
  }
};