import { Context } from 'hono';
import { Bindings, Variables } from '../types';

export const PickupController = {
  
  // 1. GET LIST (Barang Selesai Produksi)
  async getReadyOrders(c: Context<{ Bindings: Bindings }>) {
    try {
      const query = `
        SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
        FROM orders 
        JOIN customers ON orders.customer_id = customers.id
        WHERE orders.deleted_at IS NULL 
        AND orders.production_status = 'completed' 
        ORDER BY orders.updated_at DESC
      `;
      
      const { results: orders } = await c.env.DB.prepare(query).all();

      // Ambil detail items untuk hitungan harga
      const ordersWithItems = await Promise.all(orders.map(async (order: any) => {
        const { results: items } = await c.env.DB.prepare(`
          SELECT * FROM order_items WHERE order_id = ?
        `).bind(order.id).all();
        
        return { ...order, items };
      }));

      return c.json({ orders: ordersWithItems });
    } catch (e) {
      return c.json({ message: 'Gagal mengambil data' }, 500);
    }
  },

  // 2. PROSES PENGAMBILAN & PELUNASAN
 async processPickup(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    const id = c.req.param('id');
    // Tambahkan parameter 'actionType': 'pickup_now' atau 'pay_only'
    const { adjustment, paymentAmount, note, actionType } = await c.req.json();
    
    try {
      const order = await c.env.DB.prepare('SELECT total_amount, paid_amount FROM orders WHERE id = ?').bind(id).first<any>();
      if (!order) return c.json({ message: 'Order tidak ditemukan' }, 404);

      // Hitung total baru
      const finalTotal = order.total_amount - (adjustment || 0);
      const newPaidAmount = order.paid_amount + (paymentAmount || 0);
      
      // Tentukan status pembayaran
      const paymentStatus = newPaidAmount >= (finalTotal - 100) ? 'paid' : 'partial';

      // Tentukan status produksi/pengambilan
      // Jika 'pay_only', status produksi TETAP 'completed' (barang masih di toko)
      // Jika 'pickup_now', status produksi JADI 'picked_up' (barang keluar)
      let productionStatus = 'completed'; 
      let pickupTime = null;

      if (actionType === 'pickup_now') {
          productionStatus = 'picked_up';
          pickupTime = new Date().toISOString(); // Set waktu sekarang
      }

      // Query Update
      // Perhatikan: Kita update picked_up_at hanya jika actionType pickup_now
      let query = `
        UPDATE orders 
        SET payment_status = ?, 
            paid_amount = ?, 
            final_adjustment = ?, 
            note = ?
      `;
      
      const params: any[] = [paymentStatus, newPaidAmount, adjustment || 0, note];

      if (actionType === 'pickup_now') {
         query += `, production_status = 'picked_up', picked_up_at = CURRENT_TIMESTAMP`;
      }

      query += ` WHERE id = ?`;
      params.push(id);

      await c.env.DB.prepare(query).bind(...params).run();

      return c.json({ success: true, message: actionType === 'pickup_now' ? 'Barang diambil' : 'Pembayaran diterima' });
    } catch (e) {
      console.error(e);
      return c.json({ message: 'Gagal memproses' }, 500);
    }
  }
};