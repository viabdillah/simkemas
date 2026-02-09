import { Context } from 'hono';
import { CustomValidator } from '../utils/validator';
import { generateCode } from '../utils/generator'; // Import Helper Generator
import { Bindings } from '../types';

export const CustomerController = {
  
  // LIST CUSTOMERS (Support Search & Filter Trash)
  async getCustomers(c: Context<{ Bindings: Bindings }>) {
    const showDeleted = c.req.query('deleted') === 'true';
    const search = c.req.query('search') || '';

    try {
      let query = 'SELECT * FROM customers';
      const params: any[] = [];
      const conditions: string[] = [];

      // 1. Filter Sampah vs Aktif
      if (showDeleted) {
        conditions.push('deleted_at IS NOT NULL');
      } else {
        conditions.push('deleted_at IS NULL');
      }

      // 2. Filter Search (Nama, No HP, atau Kode CST)
      if (search) {
        conditions.push('(name LIKE ? OR phone LIKE ? OR code LIKE ?)');
        const likeTerm = `%${search}%`;
        params.push(likeTerm, likeTerm, likeTerm);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY created_at DESC LIMIT 50';

      const { results } = await c.env.DB.prepare(query).bind(...params).all();
      return c.json({ customers: results });
    } catch (e) {
      return c.json({ message: 'Gagal mengambil data pelanggan' }, 500);
    }
  },

  // CREATE CUSTOMER (Auto Generate Code)
  async create(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();

    // 1. Validasi
    const v = new CustomValidator(body);
    v.required('name').min('name', 3)
     .required('phone').min('phone', 8);
    
    if (body.email && body.email.trim() !== "") {
        v.isEmail('email');
    }

    const validation = v.validate();
    if (!validation.isValid) {
      return c.json({ message: 'Data tidak valid', errors: validation.errors }, 400);
    }

    try {
      // 2. Cek Duplikat No HP
      const existing = await c.env.DB.prepare('SELECT id FROM customers WHERE phone = ? AND deleted_at IS NULL').bind(body.phone).first();
      if (existing) {
        return c.json({ message: 'No WhatsApp ini sudah terdaftar!' }, 409);
      }

      // 3. Generate Kode Unik (Format: CST-NAMA-1234)
      const code = generateCode('CST', body.name);

      // 4. Insert ke DB
      await c.env.DB.prepare(
        'INSERT INTO customers (code, name, phone, email, address) VALUES (?, ?, ?, ?, ?)'
      ).bind(code, body.name, body.phone, body.email || null, body.address || null).run();

      return c.json({ message: 'Pelanggan berhasil didaftarkan', success: true }, 201);
    } catch (e) {
      console.error(e);
      return c.json({ message: 'Gagal menyimpan pelanggan' }, 500);
    }
  },

  // UPDATE CUSTOMER
  async update(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    const body = await c.req.json();

    try {
      // Cek Duplikat HP (kecuali diri sendiri)
      const existing = await c.env.DB.prepare('SELECT id FROM customers WHERE phone = ? AND id != ? AND deleted_at IS NULL')
        .bind(body.phone, id).first();
      
      if (existing) {
        return c.json({ message: 'No WhatsApp sudah dipakai pelanggan lain!' }, 409);
      }

      // Note: 'code' tidak diupdate agar konsisten
      await c.env.DB.prepare(
        'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(body.name, body.phone, body.email || null, body.address || null, id).run();

      return c.json({ message: 'Data pelanggan diperbarui', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal update pelanggan' }, 500);
    }
  },

  // SOFT DELETE
  async delete(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    await c.env.DB.prepare('UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    return c.json({ message: 'Pelanggan dipindahkan ke sampah', success: true });
  },

  // RESTORE
  async restore(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    await c.env.DB.prepare('UPDATE customers SET deleted_at = NULL WHERE id = ?').bind(id).run();
    return c.json({ message: 'Pelanggan dipulihkan', success: true });
  }
};