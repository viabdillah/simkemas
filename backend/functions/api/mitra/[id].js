import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestPut(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id; // Ini ID Produk
    const body = await context.request.json();
    const db = context.env.DB;

    // Dapatkan relasi mitranya dulu
    const targetProduct = await db.prepare("SELECT mitra_id FROM katalog_mitra WHERE id = ?").bind(id).first();
    
    if (!targetProduct) {
       return new Response(JSON.stringify(formatResponse(false, null, "Produk tidak ditemukan")), { status: 404 });
    }

    // Update parent (mitra) dan child (katalog_mitra) secara berurutan
    await db.prepare("UPDATE mitra SET nama_mitra = ?, phone = ? WHERE id = ?").bind(body.nama_mitra, body.phone, targetProduct.mitra_id).run();
    
    await db.prepare(`
      UPDATE katalog_mitra SET 
      nama_produk = ?, label = ?, merek = ?, 
      jenis_kemasan = ?, ukuran = ?, nib = ?, pirt = ?, halal = ?, catatan = ?
      WHERE id = ?
    `).bind(
      body.nama_produk, body.label, body.merek, 
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
    const id = context.params.id; // Ini ID Produk
    const db = context.env.DB;

    // Join untuk mendapakan nama mitra di Audit Log
    const target = await db.prepare(`
      SELECT m.nama_mitra, km.nama_produk 
      FROM katalog_mitra km 
      JOIN mitra m ON km.mitra_id = m.id 
      WHERE km.id = ?
    `).bind(id).first();

    // ⚠️ PERUBAHAN PENTING: Karena lo menghapus kolom is_active di schema terbaru,
    // kita ubah dari SOFT DELETE menjadi HARD DELETE.
    await db.prepare("DELETE FROM katalog_mitra WHERE id = ?").bind(id).run();

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, context.data.user.sub, 'DELETE_MITRA', `Menghapus data produk ${target?.nama_produk} milik ${target?.nama_mitra}`, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: "Data berhasil dihapus" })));
  } catch (error) {
    console.error("DELETE /api/mitra/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}