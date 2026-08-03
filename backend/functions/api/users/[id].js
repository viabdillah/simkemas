import { formatResponse, VALID_ROLES } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';
import { hashPassword } from '../../_lib/crypto'; // 🔐 Import fungsi hash

export async function onRequestPut(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const currentUserId = context.data.user.sub;

    // 🛡️ PROTEKSI ANTI-SUICIDE
    if (id === currentUserId) {
      return new Response(JSON.stringify(formatResponse(false, null, "Gagal: Anda tidak dapat mengubah peran atau kata sandi Anda sendiri!")), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json();
    const { role, newPassword } = body;

    // Validasi Role
    if (!role || !VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify(formatResponse(false, null, "Role pengguna tidak valid")), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validasi Panjang Password Baru (Hanya jika diisi)
    if (newPassword && newPassword.length < 8) {
      return new Response(JSON.stringify(formatResponse(false, null, "Kata sandi baru minimal 8 karakter")), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = context.env.DB;
    
    // Ambil data user target
    const target = await db.prepare("SELECT username, role FROM users WHERE id = ?").bind(id).first();
    
    if (!target) {
      return new Response(JSON.stringify(formatResponse(false, null, "Pengguna tidak ditemukan")), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let auditDescription = `Mengubah akses ${target.username} dari ${target.role} menjadi ${role}`;

    // 🛠️ LOGIC UPDATE BERSYARAT
    if (newPassword) {
      // Generate Hash & Salt baru
      const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
      const { hash } = await hashPassword(newPassword, saltHex);

      // Update Role & Password
      await db.prepare("UPDATE users SET role = ?, password_hash = ?, password_salt = ? WHERE id = ?")
        .bind(role, hash, saltHex, id).run();
      
      // Update deskripsi log
      auditDescription = `Mengubah akses ${target.username} dari ${target.role} menjadi ${role} (kata sandi direset)`;
    } else {
      // Update Role Saja
      await db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, id).run();
    }

    // Suntik Audit Log
    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, currentUserId, 'UPDATE_ROLE', auditDescription, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: "Data pengguna berhasil diperbarui" })), {
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

    if (id === currentUserId) {
      return new Response(JSON.stringify(formatResponse(false, null, "Gagal: Anda tidak dapat menonaktifkan akun Anda sendiri!")), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = context.env.DB;
    const target = await db.prepare("SELECT username FROM users WHERE id = ?").bind(id).first();

    if (!target) {
      return new Response(JSON.stringify(formatResponse(false, null, "Pengguna tidak ditemukan")), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.prepare("UPDATE users SET is_active = 0 WHERE id = ?").bind(id).run();

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, currentUserId, 'SOFT_DELETE', `Menonaktifkan akun karyawan: ${target.username}`, ip);

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