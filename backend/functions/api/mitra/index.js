import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi', 'Kasir', 'Manajer']);
  if (roleCheck) return roleCheck;

  try {
    const db = context.env.DB;
    
    // 🚀 SQL MAGIC: LEFT JOIN antara tabel mitra dan katalog_mitra
    const { results } = await db.prepare(`
      SELECT 
        m.id as mitra_id,
        m.nama_mitra, 
        m.phone, 
        MIN(m.created_at) as joined_date,
        json_group_array(
          CASE WHEN km.id IS NOT NULL THEN json_object(
            'id', km.id,
            'nama_produk', km.nama_produk,
            'merek', km.merek,
            'label', km.label,
            'jenis_kemasan', km.jenis_kemasan,
            'ukuran', km.ukuran,
            'nib', km.nib,
            'pirt', km.pirt,
            'halal', km.halal,
            'catatan', km.catatan
          ) ELSE NULL END
        ) as products
      FROM mitra m
      LEFT JOIN katalog_mitra km ON m.id = km.mitra_id
      GROUP BY m.id, m.phone, m.nama_mitra
      ORDER BY joined_date DESC
    `).all();

    // Parsing aman: Filter hasil array jika mitra belum punya produk (null)
    const groupedResults = results.map(row => {
      let parsedProducts = JSON.parse(row.products);
      parsedProducts = parsedProducts.filter(p => p !== null);
      
      return {
        ...row,
        products: parsedProducts
      };
    });

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

    // 1. Validasi
    if (!nama_mitra || !phone) {
      return new Response(JSON.stringify(formatResponse(false, null, "Nama Mitra dan No Telp/WA wajib diisi")), { status: 400 });
    }
    if (!Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify(formatResponse(false, null, "Minimal harus ada 1 produk yang didaftarkan")), { status: 400 });
    }
    for (let i = 0; i < products.length; i++) {
      if (!products[i].nama_produk) {
        return new Response(JSON.stringify(formatResponse(false, null, `Nama produk pada item ke-${i + 1} wajib diisi`)), { status: 400 });
      }
    }

    const db = context.env.DB;
    const currentUserId = context.data.user.sub;
    
    // 2. Cek & Insert Mitra (Upsert Logic)
    let mitra = await db.prepare("SELECT id FROM mitra WHERE phone = ?").bind(phone).first();
    let mitra_id;

    if (!mitra) {
      mitra_id = crypto.randomUUID();
      await db.prepare("INSERT INTO mitra (id, nama_mitra, phone) VALUES (?, ?, ?)").bind(mitra_id, nama_mitra, phone).run();
    } else {
      mitra_id = mitra.id;
      // Memastikan nama mitra di database sinkron jika user input nama berbeda untuk nomor HP yang sama
      await db.prepare("UPDATE mitra SET nama_mitra = ? WHERE id = ?").bind(nama_mitra, mitra_id).run();
    }

    // 3. Insert Produk
    const statements = [];
    const stmtTemplate = db.prepare(
      "INSERT INTO katalog_mitra (id, mitra_id, nama_produk, merek, label, jenis_kemasan, ukuran, nib, pirt, halal, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    for (const p of products) {
      statements.push(
        stmtTemplate.bind(
          crypto.randomUUID(),
          mitra_id, 
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

    await db.batch(statements);

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, currentUserId, 'CREATE_MITRA', `Mendaftarkan ${products.length} produk untuk Mitra ${nama_mitra}`, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: `${products.length} produk berhasil didaftarkan untuk Mitra ${nama_mitra}` })), {
      status: 201
    });

  } catch (error) {
    console.error("POST /api/mitra Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}