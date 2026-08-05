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

    // 1. Dapatkan Mitra ID yang sah
    let targetMitraId = null;

    const mitra = await db.prepare("SELECT id FROM mitra WHERE id = ?").bind(id).first();
    if (mitra) {
      targetMitraId = mitra.id;
    } else {
      const product = await db.prepare("SELECT mitra_id FROM katalog_mitra WHERE id = ?").bind(id).first();
      if (product) {
        targetMitraId = product.mitra_id;
      }
    }

    if (!targetMitraId) {
      return new Response(JSON.stringify(formatResponse(false, null, "Data mitra tidak ditemukan")), { status: 404 });
    }

    // 2. Update Header Mitra (Nama & HP)
    if (body.nama_mitra || body.phone) {
      await db.prepare(`
        UPDATE mitra 
        SET nama_mitra = COALESCE(?, nama_mitra), 
            phone = COALESCE(?, phone) 
        WHERE id = ?
      `).bind(body.nama_mitra || null, body.phone || null, targetMitraId).run();
    }

    // 3. Sync Katalog Produk (Batch Atomic Transaction)
    if (Array.isArray(body.products) && body.products.length > 0) {
      const statements = [];

      // Bersihkan katalog lama mitra ini
      statements.push(db.prepare("DELETE FROM katalog_mitra WHERE mitra_id = ?").bind(targetMitraId));

      // Insert ulang katalog produk yang dikirimkan dari UI
      const insertStmt = db.prepare(
        "INSERT INTO katalog_mitra (id, mitra_id, nama_produk, merek, label, jenis_kemasan, ukuran, nib, pirt, halal, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );

      for (const p of body.products) {
        statements.push(
          insertStmt.bind(
            p.id || crypto.randomUUID(),
            targetMitraId,
            p.nama_produk || '',
            p.merek || '',
            p.label || '',
            p.jenis_kemasan || '',
            p.ukuran || '',
            p.nib || '',
            p.pirt || '',
            p.halal || '',
            p.catatan || ''
          )
        );
      }

      await db.batch(statements);
    }

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db, 
      context.data.user.sub, 
      'UPDATE_MITRA', 
      `Mengedit data mitra: ${body.nama_mitra || targetMitraId}`, 
      ip
    );

    return new Response(JSON.stringify(formatResponse(true, { message: "Data berhasil diperbarui" })));

  } catch (error) {
    console.error("PUT /api/mitra/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, `Terjadi kesalahan server: ${error.message}`)), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const db = context.env.DB;

    // Cek jika ID adalah mitra
    const mitra = await db.prepare("SELECT nama_mitra FROM mitra WHERE id = ?").bind(id).first();
    if (mitra) {
      // Hapus mitra (katalog_mitra otomatis terhapus karena ON DELETE CASCADE)
      await db.prepare("DELETE FROM mitra WHERE id = ?").bind(id).run();

      const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
      await insertAuditLog(db, context.data.user.sub, 'DELETE_MITRA', `Menghapus mitra ${mitra.nama_mitra} beserta seluruh katalognya`, ip);
    } else {
      // Cek jika ID adalah produk tunggal
      const product = await db.prepare("SELECT nama_produk FROM katalog_mitra WHERE id = ?").bind(id).first();
      if (product) {
        await db.prepare("DELETE FROM katalog_mitra WHERE id = ?").bind(id).run();

        const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
        await insertAuditLog(db, context.data.user.sub, 'DELETE_MITRA_PRODUCT', `Menghapus produk ${product.nama_produk}`, ip);
      } else {
        return new Response(JSON.stringify(formatResponse(false, null, "Data tidak ditemukan")), { status: 404 });
      }
    }

    return new Response(JSON.stringify(formatResponse(true, { message: "Data berhasil dihapus" })));

  } catch (error) {
    console.error("DELETE /api/mitra/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}