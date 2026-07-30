import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const url = new URL(context.request.url);
    const isHistory = url.searchParams.get('history');
    const db = context.env.DB;

    let query = `
      SELECT t.*, w.current_stage, w.status as wo_status 
      FROM transactions t
      LEFT JOIN work_orders w ON t.id = w.transaction_id
    `;

    if (isHistory !== 'true') {
      query += ` WHERE (t.pickup_status != 'Diambil' AND t.pickup_status != 'Diambil Semua') OR t.pickup_status IS NULL`;
    }

    query += ` ORDER BY t.created_at DESC`;

    const { results } = await db.prepare(query).all();

    // Mengembalikan data asli langsung dari hasil JOIN, tanpa manipulasi override.
    // Kolom w.current_stage dan w.status sekarang menjadi Single Source of Truth.
    return new Response(JSON.stringify(formatResponse(true, { transactions: results })));
  } catch (error) {
    console.error("GET /api/transactions Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}

function generateInvoiceNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${yyyy}${mm}${dd}-${random}`;
}

export async function onRequestPost(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const body = await context.request.json();
    const { umkm, phone, deadline, paymentType, dpAmount, discount, grandTotal, items } = body;

    if (!umkm || !phone || !deadline || !items || items.length === 0) {
      return new Response(JSON.stringify(formatResponse(false, null, "Data pesanan tidak lengkap")), { status: 400 });
    }

    const db = context.env.DB;
    const transactionId = crypto.randomUUID();
    const invoiceNo = generateInvoiceNumber();
    const userId = context.data.user.sub;
    
    const statusLunas = paymentType === 'full' ? 'Lunas' : 'Belum Lunas';
    const nominalBayarAwal = paymentType === 'full' ? grandTotal : (dpAmount || 0);

    const stmtTransaction = db.prepare(`
      INSERT INTO transactions (id, invoice_no, umkm_name, phone, deadline, payment_type, total_amount, dp_amount, discount, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(transactionId, invoiceNo, umkm, phone, deadline, paymentType, grandTotal, nominalBayarAwal, discount, statusLunas, userId);

    const stmtItems = items.map(item => {
      return db.prepare(`
        INSERT INTO transaction_items (id, transaction_id, nama_kemasan, merek_kemasan, label_kemasan, jenis_kemasan, legalitas, catatan, qty, price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), transactionId, item.nama, item.merek, item.label, item.jenis, JSON.stringify(item.legalitas), item.catatan, item.qty, item.harga);
    });

    const stmtWorkOrder = db.prepare(`
      INSERT INTO work_orders (id, transaction_id, current_stage, status)
      VALUES (?, ?, 'Desainer', 'Menunggu')
    `).bind(crypto.randomUUID(), transactionId);

    // FIX BUG PENGUAPAN UANG: Inject Nominal DP/Lunas awal ke Cash Flows
    // SESUDAH DIPERBAIKI (Benar, menggunakan cash_flows jamak):
    let stmtCashFlow = null;
    if (nominalBayarAwal > 0) {
      stmtCashFlow = db.prepare(`
        INSERT INTO cash_flows (id, type, amount, description, flow_date, created_by)
        VALUES (?, 'MASUK', ?, ?, CURRENT_DATE, ?)
      `).bind(crypto.randomUUID(), nominalBayarAwal, `Pembayaran POS (${paymentType}): ${invoiceNo}`, userId);
    }

    // Eksekusi semua secara bersamaan
    const batchList = [stmtTransaction, ...stmtItems, stmtWorkOrder];
    if (stmtCashFlow) batchList.push(stmtCashFlow);
    await db.batch(batchList);

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(db, userId, 'CREATE_ORDER', `Membuat pesanan baru ${invoiceNo} untuk UMKM ${umkm}`, ip);

    return new Response(JSON.stringify(formatResponse(true, { message: "Pesanan berhasil diproses!", invoiceNo })), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("POST /api/transactions Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server saat memproses pesanan")), { status: 500 });
  }
}