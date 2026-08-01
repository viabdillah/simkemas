import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';

export async function onRequestGet(context) {
  // 🛡️ Proteksi: Hanya Super Administrasi yang boleh melihat statistik ini
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const db = context.env.DB;

    // 1. Hitung total pengguna yang masih aktif (is_active = 1)
    const userResult = await db.prepare("SELECT COUNT(id) as total FROM users WHERE is_active = 1").first();
    const totalUsers = userResult?.total || 0;

    // 2. Hitung jumlah aktivitas hari ini dari audit_logs 
    // Menggunakan date('now') bawaan SQLite untuk mendapatkan tanggal hari ini
    const logResult = await db.prepare("SELECT COUNT(id) as total FROM audit_logs WHERE date(created_at) = date('now')").first();
    const todayLogs = logResult?.total || 0;

    return new Response(JSON.stringify(formatResponse(true, { totalUsers, todayLogs })), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Gagal mengambil statistik dashboard")), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}