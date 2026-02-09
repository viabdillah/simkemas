import { Context } from 'hono';
import { CustomValidator } from '../utils/validator';
import { Bindings } from '../types';

export const PackagingController = {
  
  // GET ALL
  async getAll(c: Context<{ Bindings: Bindings }>) {
    try {
      const { results: types } = await c.env.DB.prepare(
        'SELECT * FROM packaging_types WHERE deleted_at IS NULL ORDER BY name ASC'
      ).all();

      const { results: sizes } = await c.env.DB.prepare(
        'SELECT * FROM packaging_sizes WHERE deleted_at IS NULL ORDER BY size ASC'
      ).all();

      const data = types.map((t: any) => ({
        ...t,
        sizes: sizes.filter((s: any) => s.type_id === t.id)
      }));

      return c.json({ packagings: data });
    } catch (e) {
      return c.json({ message: 'Gagal mengambil data kemasan' }, 500);
    }
  },

  // --- TYPE (JENIS) ---

  async createType(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();
    if (!body.name) return c.json({ message: 'Nama jenis kemasan wajib diisi' }, 400);

    try {
      await c.env.DB.prepare('INSERT INTO packaging_types (name) VALUES (?)').bind(body.name).run();
      return c.json({ message: 'Jenis kemasan disimpan', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal menyimpan' }, 500);
    }
  },

  // UPDATE TYPE (Baru)
  async updateType(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!body.name) return c.json({ message: 'Nama wajib diisi' }, 400);

    try {
      await c.env.DB.prepare('UPDATE packaging_types SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(body.name, id).run();
      return c.json({ message: 'Jenis kemasan diperbarui', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal update' }, 500);
    }
  },

  async deleteType(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE packaging_types SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id),
      c.env.DB.prepare('UPDATE packaging_sizes SET deleted_at = CURRENT_TIMESTAMP WHERE type_id = ?').bind(id)
    ]);
    return c.json({ success: true, message: 'Jenis kemasan dihapus' });
  },

  // --- SIZE (UKURAN) ---

  async createSize(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();
    const v = new CustomValidator(body);
    v.required('type_id').required('size');
    if (!v.validate().isValid) return c.json({ message: 'Data ukuran tidak lengkap' }, 400);

    try {
      await c.env.DB.prepare(
        'INSERT INTO packaging_sizes (type_id, size, price) VALUES (?, ?, ?)'
      ).bind(body.type_id, body.size, body.price || 0).run();
      return c.json({ message: 'Ukuran disimpan', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal menyimpan ukuran' }, 500);
    }
  },

  // UPDATE SIZE (Baru)
  async updateSize(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validasi minimal
    if (!body.size) return c.json({ message: 'Ukuran wajib diisi' }, 400);

    try {
      await c.env.DB.prepare(
        'UPDATE packaging_sizes SET size = ?, price = ? WHERE id = ?'
      ).bind(body.size, body.price || 0, id).run();
      return c.json({ message: 'Ukuran diperbarui', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal update ukuran' }, 500);
    }
  },

  async deleteSize(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    await c.env.DB.prepare('UPDATE packaging_sizes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Ukuran dihapus' });
  }
};