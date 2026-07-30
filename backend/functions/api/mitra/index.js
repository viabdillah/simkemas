import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const db = context.env.DB;
    const { results } = await db.prepare("SELECT * FROM katalog_mitra WHERE is_active = 1 ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(formatResponse(true, { mitra: results })));
  } catch (error) {
    console.error("GET /api/mitra Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const body = await context.request.json();
    const db = context.env.DB;
    const userId = context.data.user.sub;
    const id = crypto.randomUUID();

    // Validasi dasar
    if (!body.nama_mitra || !body.phone || !body.nama_produk) {
      return new Response(JSON.stringify(formatResponse(false, null, "Nama Mitra, Telp, dan Nama Produk wajib diisi")), { status: 400 });
    }

    await db.prepare(`
      INSERT INTO katalog_mitra (id, nama_mitra, phone, nama_produk, label, merek, jenis_kemasan, ukuran, nib, pirt, halal, catatan, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.nama_mitra, body.phone, body.nama_produk, body.label || '', body.merek || '', 
      body.jenis_kemasan || '', body.ukuran || '', body.nib || '', body.pirt || '', body.halal || '', body.catatan || '', userId
    ).run();

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, userId, 'CREATE_MITRA', `Mendaftarkan produk ${body.nama_produk} untuk Mitra ${body.nama_mitra}`, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: "Data Mitra & Produk berhasil didaftarkan" })));
  } catch (error) {
    console.error("POST /api/mitra Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}