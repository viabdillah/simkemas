import { request } from './base';

export const productService = {
  getByCustomer: async (customerId: number, deleted = false) => {
    return await request(`/api/products/customer/${customerId}?deleted=${deleted}`);
  },

  createProduct: async (customerId: number, data: any) => {
    return await request(`/api/products/customer/${customerId}`, { method: 'POST', body: JSON.stringify(data) });
  },

  updateProduct: async (id: number, data: any) => {
    return await request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteProduct: async (id: number) => {
    return await request(`/api/products/${id}`, { method: 'DELETE' });
  },

  restoreProduct: async (id: number) => {
    return await request(`/api/products/${id}/restore`, { method: 'POST' });
  }
};