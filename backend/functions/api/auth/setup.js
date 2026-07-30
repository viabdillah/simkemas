import { formatResponse } from '@simkemas/shared';
import { hashPassword } from '../../_lib/crypto';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);

    // 1. Proteksi Setup Token via Query Parameter (?setup_token=...)
    const setupToken = url.searchParams.get('setup_token');
    if (!setupToken || setupToken !== env.SETUP_TOKEN) {
      return new Response(JSON.stringify(formatResponse(false, null, "Akses ditolak.")), { status: 403 });
    }

    const db = env.DB;
    const check = await db.prepare("SELECT id FROM users LIMIT 1").first();
    if (check) {
      return new Response(JSON.stringify(formatResponse(false, null, "Setup ditolak. Database sudah berisi data.")), { status: 403 });
    }

    const username = "admin_divi";
    // Generate random password 16 karakter tanpa tanda strip
    const generatedPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 16); 

    const { hash, salt } = await hashPassword(generatedPassword);
    const userId = crypto.randomUUID();

    await db.prepare(
      "INSERT INTO users (id, username, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, username, hash, salt, 'Super Administrasi').run();

    const response = formatResponse(true, {
      message: "Akun Super Administrasi berhasil dibuat! SIMPAN PASSWORD INI SEKARANG, HANYA TAMPIL SEKALI.",
      username: username,
      password: generatedPassword // Tampilkan sekali ke layar
    });

    return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Setup Error:", error); // (Step 5) Log murni di server
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan pada server")), { status: 500 }); // (Step 5) Sembunyikan detail dari user
  }
}