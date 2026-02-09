import { Context } from 'hono';
import { Bindings } from '../types';

export const TransactionController = {
  
  // GET HISTORY (Riwayat & Saldo)
  async getAll(c: Context<{ Bindings: Bindings }>) {
    const startDate = c.req.query('start');
    const endDate = c.req.query('end');

    try {
      let query = 'SELECT * FROM transactions WHERE 1=1';
      const params: any[] = [];

      if (startDate && endDate) {
        query += ' AND date(created_at) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' ORDER BY created_at DESC';

      const { results } = await c.env.DB.prepare(query).bind(...params).all();

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