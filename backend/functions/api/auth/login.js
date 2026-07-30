import { formatResponse } from '@simkemas/shared';
import { hashPassword } from '../../_lib/crypto';
import { signJWT } from '../../_lib/jwt';
import { insertAuditLog } from '../../_lib/audit'; // <-- 1. Import helper audit log

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    const kv = env.KV_SIMKEMAS;

    if (!env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET belum diset");
      return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan pada server")), { status: 500 });
    }

    const body = await request.json();
    const { username, password } = body;
    if (!username || !password) return new Response(JSON.stringify(formatResponse(false, null, "Username dan kata sandi wajib diisi")), { status: 400 });

    const clientIP = request.headers.get('CF-Connecting-IP') || 'Local';
    const rateLimitKey = `login_attempts:${clientIP}:${username}`;
    let attempts = 0;

    if (kv) {
      const currentAttempts = await kv.get(rateLimitKey);
      if (currentAttempts) {
        attempts = parseInt(currentAttempts, 10);
        if (attempts >= 5) {
          return new Response(JSON.stringify(formatResponse(false, null, "Terlalu banyak percobaan gagal. Silakan coba lagi setelah 5 menit.")), { status: 429 });
        }
      }
    }

    const user = await db.prepare("SELECT id, username, password_hash, password_salt, role FROM users WHERE username = ?").bind(username).first();

    let loginSuccess = false;
    if (user) {
      const { hash } = await hashPassword(password, user.password_salt);
      if (hash === user.password_hash) loginSuccess = true;
    }

    if (!loginSuccess) {
      if (kv) await kv.put(rateLimitKey, (attempts + 1).toString(), { expirationTtl: 300 });
      return new Response(JSON.stringify(formatResponse(false, null, "Username atau kata sandi salah")), { status: 401 });
    }

    if (kv) await kv.delete(rateLimitKey);

    // --- 2. SUNTIK AUDIT LOG DI SINI ---
    // Karena login berhasil, catat aktivitas ini ke database
    await insertAuditLog(
      db, 
      user.id, // ID user yang baru saja berhasil login
      'LOGIN', 
      `Pengguna berhasil masuk ke dalam sistem dari alamat IP ${clientIP}`,
      clientIP
    );
    // ------------------------------------

    const payload = { sub: user.id, role: user.role, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + (15 * 60) };
    const token = await signJWT(payload, env.JWT_SECRET);
    const isSecure = (new URL(request.url)).hostname !== 'localhost' ? 'Secure;' : '';
    const cookieOptions = `HttpOnly; Path=/; SameSite=Strict; ${isSecure} Max-Age=900`;

    return new Response(JSON.stringify(formatResponse(true, { message: "Login berhasil", user: { id: user.id, username: user.username, role: user.role }})), {
      status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': `token=${token}; ${cookieOptions}` }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan pada server")), { status: 500 });
  }
}