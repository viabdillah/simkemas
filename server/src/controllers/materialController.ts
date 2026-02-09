import { Context } from 'hono';
import { Bindings } from '../types';

export const MaterialController = {
  
  // GET ALL
  async getAll(c: Context<{ Bindings: Bindings }>) {
    try {
      const { results: materials } = await c.env.DB.prepare(
        'SELECT * FROM materials WHERE deleted_at IS NULL ORDER BY created_at DESC'
      ).all();

      const { results: items } = await c.env.DB.prepare(
        'SELECT * FROM material_items WHERE deleted_at IS NULL ORDER BY name ASC'
      ).all();

      const data = materials.map((m: any) => ({
        ...m,
        items: items.filter((i: any) => i.material_id === m.id)
      }));

      return c.json({ materials: data });
    } catch (e) {
      return c.json({ message: 'Gagal mengambil data' }, 500);
    }
  },

  // CREATE MATERIAL
  async createMaterial(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();
    if (!body.name) return c.json({ message: 'Nama wajib diisi' }, 400);
    try {
      await c.env.DB.prepare('INSERT INTO materials (name) VALUES (?)').bind(body.name).run();
      return c.json({ success: true });
    } catch (e) { return c.json({ message: 'Error' }, 500); }
  },

  // UPDATE MATERIAL (BARU)
  async updateMaterial(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    const body = await c.req.json();
    try {
      await c.env.DB.prepare('UPDATE materials SET name = ? WHERE id = ?').bind(body.name, id).run();
      return c.json({ success: true });
    } catch (e) { return c.json({ message: 'Error update' }, 500); }
  },

  // DELETE MATERIAL (Soft Delete)
  async deleteMaterial(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    await c.env.DB.batch([
        c.env.DB.prepare('UPDATE materials SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id),
        c.env.DB.prepare('UPDATE material_items SET deleted_at = CURRENT_TIMESTAMP WHERE material_id = ?').bind(id)
    ]);
    return c.json({ success: true });
  },

  // CREATE ITEM
  async createItem(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();
    try {
      await c.env.DB.prepare(
        'INSERT INTO material_items (material_id, name, unit, stock) VALUES (?, ?, ?, 0)'
      ).bind(body.material_id, body.name, body.unit || 'pcs').run();
      return c.json({ success: true });
    } catch (e) { return c.json({ message: 'Error' }, 500); }
  },

  // UPDATE ITEM (BARU)
  async updateItem(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    const body = await c.req.json();
    try {
      await c.env.DB.prepare(
        'UPDATE material_items SET name = ?, unit = ? WHERE id = ?'
      ).bind(body.name, body.unit, id).run();
      return c.json({ success: true });
    } catch (e) { return c.json({ message: 'Error update item' }, 500); }
  },

  // DELETE ITEM
  async deleteItem(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    await c.env.DB.prepare('UPDATE material_items SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  }
};