import { Context } from 'hono';
import { Bindings, Variables } from '../types';

export const InventoryController = {
  
  // GET ALL STOCK (Untuk Dropdown & Table)
  async getStocks(c: Context<{ Bindings: Bindings }>) {
    try {
      // Ambil Item Bahan Baku + Nama Parentnya
      const query = `
        SELECT mi.id, mi.name as item_name, mi.stock, mi.unit, m.name as material_name
        FROM material_items mi
        JOIN materials m ON mi.material_id = m.id
        WHERE mi.deleted_at IS NULL
        ORDER BY m.name ASC, mi.name ASC
      `;
      const { results } = await c.env.DB.prepare(query).all();
      return c.json({ stocks: results });
    } catch (e) {
      return c.json({ message: 'Gagal ambil stok' }, 500);
    }
  },

  // MUTASI STOK (Bahan Baku)
  async updateStock(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    const { item_id, type, quantity, note } = await c.req.json(); // item_id = material_item_id
    const user = c.get('user') as any;

    if (!['in', 'out', 'opname'].includes(type)) return c.json({ message: 'Tipe salah' }, 400);

    try {
      const item = await c.env.DB.prepare('SELECT stock FROM material_items WHERE id = ?').bind(item_id).first<any>();
      if (!item) return c.json({ message: 'Bahan baku tidak ditemukan' }, 404);

      const oldStock = item.stock || 0;
      let newStock = 0;
      let delta = 0;

      if (type === 'in') {
        delta = Number(quantity);
        newStock = oldStock + delta;
      } else if (type === 'out') {
        delta = Number(quantity);
        newStock = oldStock - delta;
      } else if (type === 'opname') {
        newStock = Number(quantity);
        delta = newStock - oldStock;
      }

      await c.env.DB.batch([
        // Update Stok Bahan Baku
        c.env.DB.prepare('UPDATE material_items SET stock = ? WHERE id = ?').bind(newStock, item_id),
        
        // Catat Log (column material_item_id)
        c.env.DB.prepare(`
          INSERT INTO inventory_logs (material_item_id, type, quantity, previous_stock, current_stock, note, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(item_id, type, delta, oldStock, newStock, note || '', user.id)
      ]);

      return c.json({ success: true, message: 'Stok bahan baku diperbarui' });
    } catch (e) {
      console.error(e);
      return c.json({ message: 'Gagal update' }, 500);
    }
  },

  // RIWAYAT LOG (Join ke Material Items)
  async getLogs(c: Context<{ Bindings: Bindings }>) {
    try {
      const { results } = await c.env.DB.prepare(`
        SELECT l.*, mi.name as item_name, m.name as material_name
        FROM inventory_logs l
        JOIN material_items mi ON l.material_item_id = mi.id
        JOIN materials m ON mi.material_id = m.id
        ORDER BY l.created_at DESC LIMIT 100
      `).all();
      return c.json({ logs: results });
    } catch (e) {
      return c.json({ message: 'Gagal ambil log' }, 500);
    }
  }
};