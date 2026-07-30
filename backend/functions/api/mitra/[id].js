import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestPut(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const body = await context.request.json();
    const db = context.env.DB;

    await db.prepare(`
      UPDATE katalog_mitra SET 
      nama_mitra = ?, phone = ?, nama_produk = ?, label = ?, merek = ?, 
      jenis_kemasan = ?, ukuran = ?, nib = ?, pirt = ?, halal = ?, catatan = ?
      WHERE id = ?
    `).bind(
      body.nama_mitra, body.phone, body.nama_produk, body.label, body.merek, 
      body.jenis_kemasan, body.ukuran, body.nib, body.pirt, body.halal, body.catatan, id
    ).run();

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, context.data.user.sub, 'UPDATE_MITRA', `Mengedit data produk ${body.nama_produk} milik ${body.nama_mitra}`, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: "Data berhasil diperbarui" })));
  } catch (error) {
    console.error("PUT /api/mitra/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const db = context.env.DB;

    const target = await db.prepare("SELECT nama_mitra, nama_produk FROM katalog_mitra WHERE id = ?").bind(id).first();
    await db.prepare("UPDATE katalog_mitra SET is_active = 0 WHERE id = ?").bind(id).run();

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, context.data.user.sub, 'SOFT_DELETE_MITRA', `Menghapus data produk ${target?.nama_produk} milik ${target?.nama_mitra}`, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: "Data berhasil dihapus" })));
  } catch (error) {
    console.error("DELETE /api/mitra/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}