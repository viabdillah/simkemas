import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi', 'Kasir', 'Manajer']);
  if (roleCheck) return roleCheck;

  try {
    const db = context.env.DB;
    
    // 🚀 SQL MAGIC: Mengelompokkan produk ke dalam array 'products' per pelanggan
    const { results } = await db.prepare(`
      SELECT 
        nama_mitra, 
        phone, 
        MIN(created_at) as joined_date,
        json_group_array(json_object(
          'id', id,
          'nama_produk', nama_produk,
          'merek', merek,
          'label', label,
          'jenis_kemasan', jenis_kemasan,
          'ukuran', ukuran,
          'nib', nib,
          'pirt', pirt,
          'halal', halal,
          'catatan', catatan
        )) as products
      FROM katalog_mitra 
      GROUP BY phone, nama_mitra
      ORDER BY joined_date DESC
    `).all();

    // Parse string JSON dari database menjadi array object JavaScript
    const groupedResults = results.map(row => ({
      ...row,
      products: JSON.parse(row.products)
    }));

    return new Response(JSON.stringify(formatResponse(true, groupedResults)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("GET /api/mitra Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { 
      status: 500, headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function onRequestPost(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi', 'Kasir']);
  if (roleCheck) return roleCheck;

  try {
    const body = await context.request.json();
    const { nama_mitra, phone, products } = body;

    // 1. Validasi Level Atas (Header Form)
    if (!nama_mitra || !phone) {
      return new Response(JSON.stringify(formatResponse(false, null, "Nama Mitra dan No Telp/WA wajib diisi")), { 
        status: 400, headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Validasi Array Produk
    if (!Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify(formatResponse(false, null, "Minimal harus ada 1 produk yang didaftarkan")), { 
        status: 400, headers: { 'Content-Type': 'application/json' } 
      });
    }

    for (let i = 0; i < products.length; i++) {
      if (!products[i].nama_produk) {
        return new Response(JSON.stringify(formatResponse(false, null, `Nama produk pada item ke-${i + 1} wajib diisi`)), { 
          status: 400, headers: { 'Content-Type': 'application/json' } 
        });
      }
    }

    const db = context.env.DB;
    const currentUserId = context.data.user.sub;
    
    // 3. Persiapkan Query Insert Batch (Transaksi)
    const statements = [];
    const stmtTemplate = db.prepare(
      "INSERT INTO katalog_mitra (id, nama_mitra, phone, nama_produk, merek, label, jenis_kemasan, ukuran, nib, pirt, halal, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    // Loop data untuk membuat 1 baris per produk dengan duplikasi nama_mitra & phone
    for (const p of products) {
      statements.push(
        stmtTemplate.bind(
          crypto.randomUUID(), // id terpisah untuk tiap produk
          nama_mitra, 
          phone, 
          p.nama_produk, 
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

    // 🚀 Eksekusi semua query dalam satu transaksi (Jika 1 gagal, semua dibatalkan/Rollback)
    await db.batch(statements);

    // 4. Suntik Audit Log (HANYA 1 CATATAN)
    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db, 
      currentUserId, 
      'CREATE_MITRA', 
      `Mendaftarkan ${products.length} produk untuk Mitra ${nama_mitra}`, 
      ip
    );

    return new Response(JSON.stringify(formatResponse(true, { 
      message: `${products.length} produk berhasil didaftarkan untuk Mitra ${nama_mitra}` 
    })), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("POST /api/mitra Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { 
      status: 500, headers: { 'Content-Type': 'application/json' } 
    });
  }
}