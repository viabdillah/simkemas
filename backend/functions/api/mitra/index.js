import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

// 1. MENGAMBIL DATA (GET) - KEBAL PELURU 🛡️
export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi', 'Kasir', 'Manajer']);
  if (roleCheck) return roleCheck;

  try {
    const db = context.env.DB;
    const { results } = await db.prepare(`
      SELECT 
        m.id as mitra_id,
        m.nama_mitra,
        m.phone,
        m.created_at as joined_date,
        json_group_array(json_object(
          'id', k.id,
          'nama_produk', k.nama_produk,
          'merek', k.merek,
          'label', k.label,
          'jenis_kemasan', k.jenis_kemasan,
          'ukuran', k.ukuran,
          'nib', k.nib,
          'pirt', k.pirt,
          'halal', k.halal,
          'catatan', k.catatan
        )) as products
      FROM mitra m
      LEFT JOIN katalog_mitra k ON m.id = k.mitra_id
      GROUP BY m.id, m.nama_mitra, m.phone
      ORDER BY m.created_at DESC
    `).all();

    const groupedResults = results.map(row => {
      let parsedProducts = [];
      try {
        parsedProducts = JSON.parse(row.products);
      } catch(e) {
        console.error("Gagal parse JSON:", e);
      }
      
      // Deteksi aman jika mitra belum punya produk sama sekali
      const hasProducts = Array.isArray(parsedProducts) && parsedProducts.length > 0 && parsedProducts[0].id !== null;

      return {
        ...row,
        products: hasProducts ? parsedProducts : []
      };
    });

    return new Response(JSON.stringify(formatResponse(true, groupedResults)), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("GET /api/mitra Error:", error);
    // KITA KIRIM ERROR ASLINYA KE FRONTEND BIAR KETAHUAN!
    return new Response(JSON.stringify(formatResponse(false, null, "DB Error: " + error.message)), { 
      status: 500, headers: { 'Content-Type': 'application/json' } 
    });
  }
}

// 2. MENYIMPAN DATA (POST) KE 2 TABEL
export async function onRequestPost(context) {
  const roleCheck = requireRole(context.data.user, ['Super Administrasi', 'Kasir']);
  if (roleCheck) return roleCheck;

  try {
    const body = await context.request.json();
    const { nama_mitra, phone, products } = body;
    const currentUserId = context.data.user.sub;
    const db = context.env.DB;

    if (!nama_mitra || !phone || !products || products.length === 0) {
      return new Response(JSON.stringify(formatResponse(false, null, "Data mitra atau produk tidak lengkap")), { status: 400 });
    }

    const statements = [];
    let mitra = await db.prepare("SELECT id FROM mitra WHERE phone = ?").bind(phone).first();
    let mitraId;

    if (!mitra) {
      mitraId = crypto.randomUUID();
      statements.push(db.prepare("INSERT INTO mitra (id, nama_mitra, phone) VALUES (?, ?, ?)").bind(mitraId, nama_mitra, phone));
    } else {
      mitraId = mitra.id;
    }

    const stmtTemplate = db.prepare(`
      INSERT INTO katalog_mitra (id, mitra_id, nama_produk, merek, label, jenis_kemasan, ukuran, nib, pirt, halal, catatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of products) {
      statements.push(
        stmtTemplate.bind(
          crypto.randomUUID(), mitraId, p.nama_produk, p.merek || '', p.label || '', 
          p.jenis_kemasan || '', p.ukuran || '', p.nib || '', p.pirt || '', p.halal || '', p.catatan || ''
        )
      );
    }

    await db.batch(statements);

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, currentUserId, 'CREATE_MITRA', `Mendaftarkan produk untuk Mitra ${nama_mitra}`, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: `Produk berhasil ditambahkan ke katalog ${nama_mitra}` })), { status: 201 });
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return new Response(JSON.stringify(formatResponse(false, null, "Nomor WhatsApp sudah digunakan oleh mitra lain")), { status: 400 });
    }
    console.error("POST /api/mitra Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server saat menyimpan data")), { status: 500 });
  }
}