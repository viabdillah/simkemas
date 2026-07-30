import { formatResponse, validateCreateUser } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { hashPassword } from '../../_lib/crypto';
import { insertAuditLog } from '../../_lib/audit'; // <-- Import Helper

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck; 
  try {
    const db = context.env.DB;
    const { results } = await db.prepare(
      "SELECT id, username, role FROM users WHERE is_active = 1 ORDER BY role ASC, username ASC"
    ).all();
    return new Response(JSON.stringify(formatResponse(true, { users: results })), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("GET /api/users Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan pada server")), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const body = await context.request.json();
    const validation = validateCreateUser(body);
    if (!validation.ok) return new Response(JSON.stringify(formatResponse(false, null, validation.error)), { status: 400 });

    const { username, password, role } = validation.data;
    const db = context.env.DB;

    const existingUser = await db.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    if (existingUser) return new Response(JSON.stringify(formatResponse(false, null, "Username sudah digunakan")), { status: 400 });

    const { hash, salt } = await hashPassword(password);
    const userId = crypto.randomUUID();

    // Simpan User Baru
    await db.prepare(
      "INSERT INTO users (id, username, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, username, hash, salt, role).run();

    // --- SUNTIK AUDIT LOG DI SINI ---
    // Tangkap IP dari headers Cloudflare (kalau lokal, jadinya fallback 'Local')
    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db, 
      context.data.user.sub, // ID Super Admin yg lagi nge-eksekusi ini
      'CREATE_USER', 
      `Mendaftarkan pengguna baru: ${username} dengan hak akses ${role}`,
      ip
    );
    // ---------------------------------

    return new Response(JSON.stringify(formatResponse(true, { message: "Pengguna berhasil didaftarkan!" })), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("POST /api/users Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan pada server")), { status: 500 });
  }
}