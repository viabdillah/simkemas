import { request } from './base';

export const pickupService = {
  getReadyOrders: async () => {
    return await request('/api/pickup');
  },
  
  processPickup: async (id: number, data: { adjustment: number, paymentAmount: number, note: string, actionType: 'pickup_now' | 'pay_only' }) => {
    return await request(`/api/pickup/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};