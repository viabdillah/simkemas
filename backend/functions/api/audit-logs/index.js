import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';

export async function onRequestGet(context) {
  // Hanya Super Admin yang boleh melihat mata-mata sistem
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const db = context.env.DB;
    
    // Kita JOIN dengan tabel users untuk mendapatkan username pelakunya
    const { results } = await db.prepare(`
      SELECT a.id, a.action, a.details, a.ip_address, a.created_at, u.username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at ASC 
      LIMIT 200
    `).all();
    // (Pakai ASC agar data lama di atas, data baru di bawah seperti terminal)

    return new Response(JSON.stringify(formatResponse(true, { logs: results })));
  } catch (error) {
    console.error("GET /api/audit-logs Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}