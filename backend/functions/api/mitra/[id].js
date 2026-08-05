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

    // 1. Cek apakah ID ini milik Produk (katalog_mitra) atau milik Mitra (mitra)
    let product = await db.prepare("SELECT id, mitra_id FROM katalog_mitra WHERE id = ?").bind(id).first();

    let targetMitraId = null;
    let productId = null;

    if (product) {
      productId = product.id;
      targetMitraId = product.mitra_id;
    } else {
      const mitra = await db.prepare("SELECT id FROM mitra WHERE id = ?").bind(id).first();
      if (mitra) {
        targetMitraId = mitra.id;
      }
    }

    if (!targetMitraId) {
      return new Response(JSON.stringify(formatResponse(false, null, "Data mitra/produk tidak ditemukan")), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Update Header Mitra (nama_mitra & phone)
    if (body.nama_mitra || body.phone) {
      await db.prepare(`
        UPDATE mitra 
        SET nama_mitra = COALESCE(?, nama_mitra), 
            phone = COALESCE(?, phone) 
        WHERE id = ?
      `).bind(body.nama_mitra || null, body.phone || null, targetMitraId).run();
    }

    // 3. Update Detail Produk (jika ID yang diedit adalah ID Produk)
    if (productId) {
      await db.prepare(`
        UPDATE katalog_mitra SET 
          nama_produk = COALESCE(?, nama_produk), 
          label = ?, 
          merek = ?, 
          jenis_kemasan = ?, 
          ukuran = ?, 
          nib = ?, 
          pirt = ?, 
          halal = ?, 
          catatan = ?
        WHERE id = ?
      `).bind(
        body.nama_produk || null, 
        body.label || '', 
        body.merek || '', 
        body.jenis_kemasan || '', 
        body.ukuran || '', 
        body.nib || '', 
        body.pirt || '', 
        body.halal || '', 
        body.catatan || '', 
        productId
      ).run();
    }

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db, 
      context.data.user.sub, 
      'UPDATE_MITRA', 
      `Mengedit data mitra/produk: ${body.nama_mitra || body.nama_produk || id}`, 
      ip
    );

    return new Response(JSON.stringify(formatResponse(true, { message: "Data berhasil diperbarui" })), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("PUT /api/mitra/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, `Terjadi kesalahan server: ${error.message}`)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const id = context.params.id;
    const db = context.env.DB;

    // Deteksi apakah menghapus 1 produk atau menghapus 1 mitra penuh
    const product = await db.prepare(`
      SELECT km.id, km.nama_produk, m.nama_mitra 
      FROM katalog_mitra km 
      JOIN mitra m ON km.mitra_id = m.id 
      WHERE km.id = ?
    `).bind(id).first();

    if (product) {
      await db.prepare("DELETE FROM katalog_mitra WHERE id = ?").bind(id).run();
      
      const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
      await insertAuditLog(db, context.data.user.sub, 'DELETE_MITRA_PRODUCT', `Menghapus produk ${product.nama_produk} milik ${product.nama_mitra}`, ip);
    } else {
      const mitra = await db.prepare("SELECT nama_mitra FROM mitra WHERE id = ?").bind(id).first();
      if (mitra) {
        // Hapus mitra (produk terhapus otomatis karena CASCADE)
        await db.prepare("DELETE FROM mitra WHERE id = ?").bind(id).run();

        const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
        await insertAuditLog(db, context.data.user.sub, 'DELETE_MITRA', `Menghapus mitra ${mitra.nama_mitra} beserta seluruh produknya`, ip);
      } else {
        return new Response(JSON.stringify(formatResponse(false, null, "Data tidak ditemukan")), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify(formatResponse(true, { message: "Data berhasil dihapus" })), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("DELETE /api/mitra/[id] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}