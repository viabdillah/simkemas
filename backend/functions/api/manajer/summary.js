import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const url = new URL(context.request.url);
    const today = new Date();
    const year = url.searchParams.get('year') || today.getFullYear();
    const month = String(url.searchParams.get('month') || (today.getMonth() + 1)).padStart(2, '0');
    
    const yearMonth = `${year}-${month}`;
    const db = context.env.DB;

    // 🛠️ SELF-HEALING SQL YANG SUDAH DIPERBAIKI (Safety Net / Jaring Pengaman)
    // "Lunas" Dihapus karena itu adalah value dari status pembayaran, BUKAN pickup_status.
    await db.prepare(`
      UPDATE work_orders 
      SET current_stage = 'Selesai', status = 'Diambil Semua', updated_at = CURRENT_TIMESTAMP
      WHERE (
        transaction_id IN (SELECT id FROM transactions WHERE pickup_status IN ('Diambil', 'Diambil Semua'))
      ) AND current_stage != 'Selesai'
    `).run();

    // 1. Total Omzet & Jumlah Transaksi Bulan Ini
    const { results: omzetRes } = await db.prepare(`
      SELECT SUM(total_amount) as total_omzet, COUNT(id) as total_trx
      FROM transactions
      WHERE created_at LIKE ?
    `).bind(`${yearMonth}-%`).all();

    const omzetBulanIni = omzetRes[0]?.total_omzet || 0;
    const trxBulanIni = omzetRes[0]?.total_trx || 0;

    // 2. SPK Aktif yang BENAR-BENAR mandek di Pabrik (Kecuali Selesai)
    const { results: spkPabrik } = await db.prepare(`
      SELECT current_stage, COUNT(id) as count
      FROM work_orders
      WHERE current_stage IN ('Desainer', 'Operator Mesin', 'Operator Packaging', 'Kasir')
      GROUP BY current_stage
    `).all();

    let totalSpkMandek = 0;
    const stageCounts = { Desainer: 0, 'Operator Mesin': 0, 'Operator Packaging': 0, Kasir: 0 };
    spkPabrik.forEach(row => {
      stageCounts[row.current_stage] = row.count;
      totalSpkMandek += row.count;
    });

    // 3. Tren & Pola Jenis Kemasan Paling Banyak Dibeli
    const { results: topKemasan } = await db.prepare(`
      SELECT ti.jenis_kemasan, SUM(ti.qty) as total_qty, COUNT(ti.id) as total_item_order
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.created_at LIKE ?
      GROUP BY ti.jenis_kemasan
      ORDER BY total_qty DESC
    `).bind(`${yearMonth}-%`).all();

    // 4. Ringkasan Pemasukan & Pengeluaran Arus Kas
    const { results: cashFlowSummary } = await db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'MASUK' THEN amount ELSE 0 END) as total_pemasukan,
        SUM(CASE WHEN type = 'KELUAR' THEN amount ELSE 0 END) as total_pengeluaran
      FROM cash_flows
      WHERE flow_date LIKE ?
    `).bind(`${yearMonth}-%`).all();

    const totalPemasukan = cashFlowSummary[0]?.total_pemasukan || 0;
    const totalPengeluaran = cashFlowSummary[0]?.total_pengeluaran || 0;

    // 5. Daftar SPK Aktif Terbaru di Pabrik (Murni yang belum selesai)
    const { results: recentSpk } = await db.prepare(`
      SELECT w.*, t.invoice_no, t.umkm_name, t.deadline, t.created_at as order_date
      FROM work_orders w
      JOIN transactions t ON w.transaction_id = t.id
      WHERE w.current_stage != 'Selesai'
      ORDER BY t.created_at DESC
      LIMIT 5
    `).all();

    return new Response(JSON.stringify(formatResponse(true, {
      summary: {
        omzetBulanIni,
        trxBulanIni,
        totalSpkMandek,
        stageCounts,
        totalPemasukan,
        totalPengeluaran,
        saldoNetto: totalPemasukan - totalPengeluaran
      },
      topKemasan,
      recentSpk
    })));
  } catch (error) {
    console.error("GET /api/manajer/summary Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}