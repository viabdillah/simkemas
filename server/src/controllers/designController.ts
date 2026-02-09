import { Context } from 'hono';
import { Bindings, Variables } from '../types'; // Import dari file types Anda

export const DesignController = {
  
  // 1. GET QUEUE
  async getQueue(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    try {
      const query = `
        SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
        FROM orders 
        JOIN customers ON orders.customer_id = customers.id
        WHERE orders.deleted_at IS NULL 
        AND orders.production_status IN ('pending_design', 'in_design', 'design_revision')
        ORDER BY orders.deadline ASC, orders.created_at ASC
      `;
      
      const { results: orders } = await c.env.DB.prepare(query).all();

      const ordersWithItems = await Promise.all(orders.map(async (order: any) => {
        // UPDATE QUERY: Ambil detail lengkap produk (netto, pirt, halal, nib, size)
        const { results: items } = await c.env.DB.prepare(`
          SELECT 
            order_items.*, 
            products.name as product_name, 
            products.packaging_type,
            products.packaging_size,
            products.netto,
            products.pirt,
            products.halal,
            products.nib
          FROM order_items
          JOIN products ON order_items.product_id = products.id
          WHERE order_items.order_id = ?
        `).bind(order.id).all();
        
        return { ...order, items };
      }));

      return c.json({ orders: ordersWithItems });
    } catch (e) {
      console.error("Queue Error:", e);
      return c.json({ message: 'Gagal mengambil antrian desain' }, 500);
    }
  },

  // 2. UPDATE STATUS
  async updateStatus(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    const id = c.req.param('id');
    const { status, note } = await c.req.json();
    const user = c.get('user') as any;

    const allowed = ['in_design', 'design_revision', 'ready_to_print'];
    if (!allowed.includes(status)) return c.json({ message: 'Status tidak valid' }, 400);

    try {
      await c.env.DB.prepare(`
        UPDATE orders SET production_status = ?, designer_id = ?, note = ? WHERE id = ?
      `).bind(status, user.id, note ? note : null, id).run();
      return c.json({ success: true, message: 'Status desain diperbarui' });
    } catch (e) {
      console.error("Update Error:", e);
      return c.json({ message: 'Gagal update status' }, 500);
    }
  },

  // 3. HISTORY
  async getHistory(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    const user = c.get('user') as any;
    let query = `
        SELECT orders.*, customers.name as customer_name 
        FROM orders JOIN customers ON orders.customer_id = customers.id
        WHERE orders.production_status IN ('ready_to_print', 'printed', 'completed')
    `;
    const params: any[] = [];
    if (user.role === 'desainer') {
        query += ` AND orders.designer_id = ?`;
        params.push(user.id);
    }
    query += ` ORDER BY orders.updated_at DESC LIMIT 50`;
    try {
      const { results } = await c.env.DB.prepare(query).bind(...params).all();
      return c.json({ orders: results });
    } catch (e) {
      return c.json({ message: 'Gagal mengambil riwayat' }, 500);
    }
  }
};