import { Context } from 'hono';
import { CustomValidator } from '../utils/validator';
import { generateCode } from '../utils/generator';
import { Bindings } from '../types';

export const ProductController = {
  
  // GET PRODUCTS BY CUSTOMER ID
  async getByCustomer(c: Context<{ Bindings: Bindings }>) {
    const customerId = c.req.param('customerId');
    const showDeleted = c.req.query('deleted') === 'true';

    try {
      let query = 'SELECT * FROM products WHERE customer_id = ?';
      if (showDeleted) {
        query += ' AND deleted_at IS NOT NULL';
      } else {
        query += ' AND deleted_at IS NULL';
      }
      query += ' ORDER BY created_at DESC';

      const { results } = await c.env.DB.prepare(query).bind(customerId).all();
      
      // Parse variants (JSON String -> Array)
      const products = results.map((p: any) => ({
        ...p,
        variants: JSON.parse(p.variants || '[]')
      }));

      return c.json({ products });
    } catch (e) {
      return c.json({ message: 'Gagal mengambil data produk' }, 500);
    }
  },

  // CREATE PRODUCT
  async create(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();
    const customerId = c.req.param('customerId');

    const v = new CustomValidator(body);
    v.required('name').required('brand');
    
    if (!v.validate().isValid) return c.json({ message: 'Data tidak lengkap' }, 400);

    try {
      // Generate ID Unik PDK
      const code = generateCode('PDK', body.name);
      
      // Variants disimpan sebagai JSON String
      const variantsJson = JSON.stringify(body.variants || []);

      await c.env.DB.prepare(
        `INSERT INTO products (customer_id, code, name, brand, variants, netto, packaging_type, packaging_size, nib, halal, pirt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        customerId, code, body.name, body.brand, variantsJson, 
        body.netto, body.packaging_type, body.packaging_size, 
        body.nib, body.halal, body.pirt
      ).run();

      return c.json({ message: 'Produk berhasil ditambahkan', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal menyimpan produk' }, 500);
    }
  },

  // UPDATE PRODUCT
  async update(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    const body = await c.req.json();

    try {
      const variantsJson = JSON.stringify(body.variants || []);

      await c.env.DB.prepare(
        `UPDATE products SET name=?, brand=?, variants=?, netto=?, packaging_type=?, packaging_size=?, nib=?, halal=?, pirt=?, updated_at=CURRENT_TIMESTAMP 
         WHERE id=?`
      ).bind(
        body.name, body.brand, variantsJson, body.netto, 
        body.packaging_type, body.packaging_size, body.nib, 
        body.halal, body.pirt, id
      ).run();

      return c.json({ message: 'Produk diperbarui', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal update produk' }, 500);
    }
  },

  // SOFT DELETE
  async delete(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    await c.env.DB.prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    return c.json({ message: 'Produk dihapus', success: true });
  },

  // RESTORE
  async restore(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    await c.env.DB.prepare('UPDATE products SET deleted_at = NULL WHERE id = ?').bind(id).run();
    return c.json({ message: 'Produk dipulihkan', success: true });
  }
};