import { Context } from 'hono';
import { Bindings, Variables } from '../types';

export const ProductionController = {
  
  // 1. GET QUEUE (Antrian Cetak & Proses)
  async getQueue(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    try {
      // Ambil order dengan status 'ready_to_print' (Masuk) atau 'in_production' (Sedang jalan)
      const query = `
        SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
        FROM orders 
        JOIN customers ON orders.customer_id = customers.id
        WHERE orders.deleted_at IS NULL 
        AND orders.production_status IN ('ready_to_print', 'in_production')
        ORDER BY orders.deadline ASC, orders.created_at ASC
      `;
      
      const { results: orders } = await c.env.DB.prepare(query).all();

      // Ambil detail items (Operator butuh info Qty & Jenis Bahan)
      const ordersWithItems = await Promise.all(orders.map(async (order: any) => {
        const { results: items } = await c.env.DB.prepare(`
          SELECT 
            order_items.*, 
            products.name as product_name, 
            products.packaging_type,
            products.packaging_size,
            products.netto
          FROM order_items
          JOIN products ON order_items.product_id = products.id
          WHERE order_items.order_id = ?
        `).bind(order.id).all();
        
        return { ...order, items };
      }));

      return c.json({ orders: ordersWithItems });
    } catch (e) {
      console.error("Prod Queue Error:", e);
      return c.json({ message: 'Gagal mengambil antrian produksi' }, 500);
    }
  },

  async updateStatus(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    const id = c.req.param('id');
    // TAMBAHAN: Terima actualQuantity
    const { status, note, materialsUsed, actualQuantity } = await c.req.json(); 
    const user = c.get('user') as any;

    const allowed = ['in_production', 'completed'];
    if (!allowed.includes(status)) return c.json({ message: 'Status tidak valid' }, 400);

    try {
      const statements: any[] = [];

      // UPDATE: Simpan actual_quantity jika ada
      statements.push(c.env.DB.prepare(`
        UPDATE orders 
        SET production_status = ?, operator_id = ?, note = ?, actual_quantity = ?
        WHERE id = ?
      `).bind(
        status, 
        user.id, 
        note ? note : null, 
        actualQuantity ? Number(actualQuantity) : 0, // Simpan QC
        id
      ));

      // Logika Pengurangan Stok (Sama seperti sebelumnya)
      if (materialsUsed && Array.isArray(materialsUsed) && materialsUsed.length > 0) {
        for (const mat of materialsUsed) {
            if(mat.item_id && mat.quantity > 0) {
                const item = await c.env.DB.prepare('SELECT stock FROM material_items WHERE id = ?').bind(mat.item_id).first<any>();
                const currentStock = item?.stock || 0;
                const newStock = currentStock - Number(mat.quantity);

                statements.push(c.env.DB.prepare(
                    'UPDATE material_items SET stock = ? WHERE id = ?'
                ).bind(newStock, mat.item_id));

                statements.push(c.env.DB.prepare(`
                    INSERT INTO inventory_logs (material_item_id, type, quantity, previous_stock, current_stock, note, user_id)
                    VALUES (?, 'out', ?, ?, ?, ?, ?)
                `).bind(
                    mat.item_id, 
                    Number(mat.quantity), 
                    currentStock, 
                    newStock, 
                    `Produksi Order #${id} (${status === 'in_production' ? 'Mulai' : 'Selesai/Tambahan'})`, 
                    user.id
                ));
            }
        }
      }

      await c.env.DB.batch(statements);
      return c.json({ success: true });
    } catch (e) {
      return c.json({ message: 'Gagal update status' }, 500);
    }
  },

  // 3. HISTORY (Riwayat Cetak Operator)
  async getHistory(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    const user = c.get('user') as any;
    
    let query = `
        SELECT orders.*, customers.name as customer_name 
        FROM orders 
        JOIN customers ON orders.customer_id = customers.id
        WHERE orders.production_status = 'completed'
    `;
    
    const params: any[] = [];
    // Jika Role OPERATOR, hanya lihat yang dia kerjakan
    if (user.role === 'operator') {
        query += ` AND orders.operator_id = ?`;
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