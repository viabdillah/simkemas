import { formatResponse, VALID_ROLES } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestPut(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const currentUserId = context.data.user.sub;

    // 🛡️ PROTEKSI ANTI-SUICIDE
    if (id === currentUserId) {
      return new Response(JSON.stringify(formatResponse(false, null, "Gagal: Anda tidak dapat mengubah peran Anda sendiri!")), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify(formatResponse(false, null, "Role pengguna tidak valid")), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = context.env.DB;
    
    // Ambil data user target
    const target = await db.prepare("SELECT username, role FROM users WHERE id = ?").bind(id).first();
    
    // 🛠️ BUG FIX: Cek jika target tidak ditemukan di database
    if (!target) {
      return new Response(JSON.stringify(formatResponse(false, null, "Pengguna tidak ditemukan")), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update data role
    await db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, id).run();

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db,
      currentUserId,
      'UPDATE_ROLE',
      // Karena target sudah divalidasi pasti ada, kita bisa langsung panggil target.username tanpa "?"
      `Mengubah akses ${target.username} dari ${target.role} menjadi ${role}`,
      ip
    );

    return new Response(JSON.stringify(formatResponse(true, { message: "Role pengguna berhasil diperbarui" })), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("PUT /api/users/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


export async function onRequestDelete(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const currentUserId = context.data.user.sub;

    // 🛡️ PROTEKSI ANTI-SUICIDE
    if (id === currentUserId) {
      return new Response(JSON.stringify(formatResponse(false, null, "Gagal: Anda tidak dapat menonaktifkan akun Anda sendiri!")), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = context.env.DB;

    // Ambil nama user target untuk ditulis di log
    const target = await db.prepare("SELECT username FROM users WHERE id = ?").bind(id).first();

    // 🛠️ BUG FIX: Cek jika target tidak ditemukan di database
    if (!target) {
      return new Response(JSON.stringify(formatResponse(false, null, "Pengguna tidak ditemukan")), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Lakukan Soft Delete
    await db.prepare("UPDATE users SET is_active = 0 WHERE id = ?").bind(id).run();

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db,
      currentUserId,
      'SOFT_DELETE',
      `Menonaktifkan akun karyawan: ${target.username}`,
      ip
    );

    return new Response(JSON.stringify(formatResponse(true, { message: "Pengguna berhasil dinonaktifkan (Soft Delete)" })), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("DELETE /api/users/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}