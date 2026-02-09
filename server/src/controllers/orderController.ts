import { Context } from 'hono';
import { CustomValidator } from '../utils/validator';
import { generateInvoiceNumber } from '../utils/generator';
import { Bindings } from '../types';

export const OrderController = {
  
  // 1. GET ALL ORDERS (Riwayat Pesanan)
  async getAll(c: Context<{ Bindings: Bindings }>) {
    const search = c.req.query('search') || '';
    
    try {
      let query = `
        SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone 
        FROM orders 
        JOIN customers ON orders.customer_id = customers.id
        WHERE orders.deleted_at IS NULL
      `;
      
      const params: any[] = [];
      
      if (search) {
        query += ` AND (customers.name LIKE ? OR orders.code LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += ` ORDER BY orders.created_at DESC LIMIT 50`;
      
      const { results } = await c.env.DB.prepare(query).bind(...params).all();
      return c.json({ orders: results });
    } catch (e) {
      return c.json({ message: 'Gagal mengambil riwayat pesanan' }, 500);
    }
  },

  // 2. GET SINGLE ORDER (Detail untuk Invoice)
  async getOne(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    try {
      // Ambil Header Order & Info Customer
      const order = await c.env.DB.prepare(`
        SELECT orders.*, customers.name as customer_name, customers.address as customer_address, customers.phone as customer_phone, customers.email as customer_email
        FROM orders 
        JOIN customers ON orders.customer_id = customers.id
        WHERE orders.id = ?
      `).bind(id).first();

      if (!order) return c.json({ message: 'Pesanan tidak ditemukan' }, 404);

      // Ambil Items & Info Produk
      const { results: items } = await c.env.DB.prepare(`
        SELECT order_items.*, products.name as product_name, products.brand, products.packaging_type 
        FROM order_items 
        JOIN products ON order_items.product_id = products.id
        WHERE order_items.order_id = ?
      `).bind(id).all();

      return c.json({ order: { ...order, items } });
    } catch (e) {
      return c.json({ message: 'Gagal memuat detail pesanan' }, 500);
    }
  },

  // 3. CREATE ORDER (Transaksi Baru)
  async create(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();
    
    // 1. Validasi Input Dasar
    const v = new CustomValidator(body);
    v.required('customer_id').required('items').required('payment_option');
    if (!v.validate().isValid) return c.json({ message: 'Data tidak lengkap' }, 400);

    try {
      const code = generateInvoiceNumber();
      
      // 2. Hitung Subtotal (Total Harga Barang)
      let subtotal = 0;
      const items = body.items.map((item: any) => {
        const lineTotal = Number(item.quantity) * Number(item.price);
        subtotal += lineTotal;
        return { ...item, subtotal: lineTotal };
      });

      // 3. Ambil Diskon (Default 0)
      const discount = Number(body.discount || 0);

      // 4. Hitung Grand Total (Subtotal - Diskon)
      let grandTotal = subtotal - discount;
      if (grandTotal < 0) grandTotal = 0;

      // 5. Logika Status Pembayaran & Jumlah Bayar
      let paidAmount = 0;
      let paymentStatus = 'unpaid';

      if (body.payment_option === 'full') {
        paidAmount = grandTotal;
        paymentStatus = 'paid';
      } else if (body.payment_option === 'dp') {
        paidAmount = Number(body.paid_amount || 0);
        // Jika DP >= Total, anggap lunas
        if (paidAmount >= grandTotal) {
            paymentStatus = 'paid';
            paidAmount = grandTotal;
        } else {
            paymentStatus = 'partial';
        }
      } else {
        // Pay Later (Nanti)
        paidAmount = 0;
        paymentStatus = 'unpaid';
      }

      // 6. INSERT HEADER (Tabel orders)
      const result = await c.env.DB.prepare(
        `INSERT INTO orders (code, customer_id, total_amount, discount, status, payment_status, note, deadline, payment_option, paid_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
      ).bind(
        code, body.customer_id, grandTotal, discount, 'pending', paymentStatus, 
        body.note || '', body.deadline || null, body.payment_option, paidAmount
      ).first();

      if (!result) throw new Error('Gagal membuat header pesanan');
      const orderId = result.id;

      // 7. INSERT ITEMS (Tabel order_items)
      const stmt = c.env.DB.prepare(
        `INSERT INTO order_items (order_id, product_id, variant, quantity, price, subtotal, note, has_design) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      const batch = items.map((item: any) => 
        stmt.bind(
            orderId, 
            item.product_id, 
            item.variant, 
            item.quantity, 
            item.price, 
            item.subtotal, 
            item.note || '', 
            item.has_design ? 1 : 0
        )
      );

      await c.env.DB.batch(batch);

      // 8. AUTO-RECORD KEUANGAN (Jika ada uang masuk)
      if (paidAmount > 0) {
        // Ambil nama pelanggan untuk deskripsi transaksi
        const cust = await c.env.DB.prepare('SELECT name FROM customers WHERE id = ?').bind(body.customer_id).first<any>();
        const custName = cust ? cust.name : 'Pelanggan';

        // Tentukan label transaksi
        const descType = body.payment_option === 'full' ? 'Pelunasan Awal' : 'Down Payment (DP)';
        const description = `INV ${code} - ${custName} - ${descType}`;

        // Catat ke tabel transactions (Tipe 'in' = Pemasukan)
        await c.env.DB.prepare(
            `INSERT INTO transactions (type, category, amount, description, related_order_id) 
             VALUES ('in', 'Penjualan', ?, ?, ?)`
        ).bind(paidAmount, description, orderId).run();
      }

      return c.json({ message: 'Pesanan berhasil dibuat', success: true, orderId, code }, 201);

    } catch (e: any) {
      console.error(e);
      return c.json({ message: 'Gagal memproses transaksi: ' + e.message }, 500);
    }
  }
};