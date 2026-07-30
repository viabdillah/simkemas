import { formatResponse, VALID_ROLES } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit'; // <-- Import Helper

export async function onRequestPut(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const body = await context.request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify(formatResponse(false, null, "Role pengguna tidak valid")), { status: 400 });
    }

    const db = context.env.DB;
    
    // Ambil nama user target untuk ditulis di log (biar jelas siapa yg di-edit)
    const target = await db.prepare("SELECT username, role FROM users WHERE id = ?").bind(id).first();
    
    await db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, id).run();

    // --- SUNTIK AUDIT LOG ---
    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db,
      context.data.user.sub,
      'UPDATE_ROLE',
      `Mengubah akses ${target?.username} dari ${target?.role} menjadi ${role}`,
      ip
    );
    // ------------------------

    return new Response(JSON.stringify(formatResponse(true, { message: "Role pengguna berhasil diperbarui" })));
  } catch (error) {
    console.error("PUT /api/users/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const db = context.env.DB;

    // Ambil nama user target untuk ditulis di log
    const target = await db.prepare("SELECT username FROM users WHERE id = ?").bind(id).first();

    await db.prepare("UPDATE users SET is_active = 0 WHERE id = ?").bind(id).run();

    // --- SUNTIK AUDIT LOG ---
    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db,
      context.data.user.sub,
      'SOFT_DELETE',
      `Menonaktifkan akun karyawan: ${target?.username}`,
      ip
    );
    // ------------------------

    return new Response(JSON.stringify(formatResponse(true, { message: "Pengguna berhasil dinonaktifkan (Soft Delete)" })));
  } catch (error) {
    console.error("DELETE /api/users/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}