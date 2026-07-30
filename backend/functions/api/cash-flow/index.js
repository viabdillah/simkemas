import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

// GET /api/cash-flow?year=2026&month=7
export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const url = new URL(context.request.url);
    const year = url.searchParams.get('year') || new Date().getFullYear();
    const month = String(url.searchParams.get('month') || (new Date().getMonth() + 1)).padStart(2, '0');
    
    const startDate = `${year}-${month}-01`;
    // Mendapatkan tanggal terakhir di bulan tsb
    const lastDay = new Date(year, parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    const db = context.env.DB;

    // 1. Ambil daftar entri arus kas bulan tsb (MENGGUNAKAN cash_flows)
    const { results: flows } = await db.prepare(`
      SELECT * FROM cash_flows 
      WHERE flow_date BETWEEN ? AND ? 
      ORDER BY flow_date ASC, created_at ASC
    `).bind(startDate, endDate).all();

    // 2. Ambil akumulasi data harian dari tgl 1 s/d akhir bulan untuk Chart Analitik
    const { results: dailyStats } = await db.prepare(`
      SELECT 
        flow_date,
        SUM(CASE WHEN type = 'MASUK' THEN amount ELSE 0 END) as total_masuk,
        SUM(CASE WHEN type = 'KELUAR' THEN amount ELSE 0 END) as total_keluar
      FROM cash_flows
      WHERE flow_date BETWEEN ? AND ?
      GROUP BY flow_date
      ORDER BY flow_date ASC
    `).bind(startDate, endDate).all();

    return new Response(JSON.stringify(formatResponse(true, { flows, dailyStats, lastDay, year, month })));
  } catch (error) {
    console.error("GET /api/cash-flow Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}

// POST /api/cash-flow -> Input Uang Masuk / Keluar Manual
export async function onRequestPost(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const body = await context.request.json();
    const { type, amount, description, flow_date } = body;

    if (!type || !amount || !description || !flow_date) {
      return new Response(JSON.stringify(formatResponse(false, null, "Mohon lengkapi semua field arus kas")), { status: 400 });
    }

    const db = context.env.DB;
    const id = crypto.randomUUID();
    const userId = context.data.user.sub;

    // INSERT MENGGUNAKAN cash_flows
    await db.prepare(`
      INSERT INTO cash_flows (id, type, amount, description, flow_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, type, parseInt(amount), description, flow_date, userId).run();

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, userId, 'CASH_FLOW_ENTRY', `Input Arus Kas ${type}: Rp ${parseInt(amount).toLocaleString('id-ID')} (${description})`, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: "Data Arus Kas berhasil disimpan!" })));
  } catch (error) {
    console.error("POST /api/cash-flow Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}