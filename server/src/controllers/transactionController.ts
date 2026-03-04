import { Context } from 'hono';
import { Bindings } from '../types';

export const TransactionController = {

  // GET HISTORY (Riwayat & Saldo)
  async getAll(c: Context<{ Bindings: Bindings }>) {
    const startDate = c.req.query('start');
    const endDate = c.req.query('end');

    try {
      let query1 = `
          SELECT id, type, category, amount, description, created_at 
          FROM transactions WHERE 1=1
      `;
      let query2 = `
          SELECT 
            orders.id, 
            'in' as type, 
            'Pesanan' as category, 
            orders.paid_amount as amount, 
            'Pembayaran pesanan ' || orders.code || ' - ' || COALESCE((SELECT name FROM customers WHERE id = orders.customer_id), 'Pelanggan') as description, 
            orders.created_at 
          FROM orders 
          WHERE orders.paid_amount > 0 
            AND orders.id NOT IN (SELECT related_order_id FROM transactions WHERE related_order_id IS NOT NULL)
      `;

      const params1: any[] = [];
      const params2: any[] = [];

      if (startDate && endDate) {
        query1 += ' AND date(created_at) >= ? AND date(created_at) <= ?';
        query2 += ' AND date(created_at) >= ? AND date(created_at) <= ?';
        params1.push(startDate, endDate);
        params2.push(startDate, endDate);
      }

      let statement1 = c.env.DB.prepare(query1);
      let statement2 = c.env.DB.prepare(query2);

      if (params1.length > 0) {
        statement1 = statement1.bind(...params1);
        statement2 = statement2.bind(...params2);
      }

      const res1 = await statement1.all();
      const res2 = await statement2.all();

      let results = [...((res1 as any).results || []), ...((res2 as any).results || [])] as any[];
      // Urutkan manual array berdasarkan created_at descending
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Hitung Ringkasan
      let totalIn = 0;
      let totalOut = 0;

      results.forEach((t: any) => {
        if (t.type === 'in') totalIn += t.amount;
        else totalOut += t.amount;
      });

      return c.json({
        transactions: results,
        summary: {
          total_in: totalIn,
          total_out: totalOut,
          balance: totalIn - totalOut
        }
      });
    } catch (e) {
      console.error("D1 Error:", e);
      return c.json({ message: 'Gagal mengambil data keuangan' }, 500);
    }
  },

  // CREATE EXPENSE (Catat Pengeluaran Manual)
  async createManual(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();

    // Validasi input
    if (!body.amount || !body.description || !body.type) {
      return c.json({ message: 'Data transaksi tidak lengkap' }, 400);
    }

    // Validasi tipe
    if (!['in', 'out'].includes(body.type)) {
      return c.json({ message: 'Tipe transaksi harus in (Masuk) atau out (Keluar)' }, 400);
    }

    try {
      await c.env.DB.prepare(
        `INSERT INTO transactions (type, category, amount, description, user_id) 
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        body.type,                // 'in' atau 'out'
        body.category || 'Umum',
        body.amount,
        body.description,
        0
      ).run();

      return c.json({ message: 'Transaksi berhasil dicatat', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal menyimpan transaksi' }, 500);
    }
  }
};