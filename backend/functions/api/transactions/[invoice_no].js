import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const invoiceNo = context.params.invoice_no;
    const db = context.env.DB;

    const transaction = await db.prepare("SELECT * FROM transactions WHERE invoice_no = ?").bind(invoiceNo).first();
    if (!transaction) {
      return new Response(JSON.stringify(formatResponse(false, null, "Invoice tidak ditemukan")), { status: 404 });
    }

    const { results: items } = await db.prepare("SELECT * FROM transaction_items WHERE transaction_id = ?").bind(transaction.id).all();

    return new Response(JSON.stringify(formatResponse(true, { transaction, items })));
  } catch (error) {
    console.error("GET /api/transactions/[invoice_no] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}

export async function onRequestPut(context) {
  const roleCheck = requireRole(context.data.user, ['Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const invoiceNo = context.params.invoice_no;
    const body = await context.request.json();
    const { pickup_status, pickup_notes, additional_payment, is_full_payment } = body;
    const db = context.env.DB;

    const transaction = await db.prepare("SELECT * FROM transactions WHERE invoice_no = ?").bind(invoiceNo).first();
    if (!transaction) {
      return new Response(JSON.stringify(formatResponse(false, null, "Invoice tidak ditemukan")), { status: 404 });
    }

    let finalNotes = pickup_notes !== undefined ? pickup_notes : (transaction.pickup_notes || '');
    let newDpAmount = transaction.dp_amount || 0;
    let newStatus = transaction.status;
    let uangMasukKeBukuKas = 0;

    if (is_full_payment) {
      uangMasukKeBukuKas = transaction.total_amount - newDpAmount; 
      newDpAmount = transaction.total_amount;
      newStatus = 'Lunas';
    } else if (additional_payment && parseInt(additional_payment, 10) > 0) {
      uangMasukKeBukuKas = parseInt(additional_payment, 10);
      newDpAmount += uangMasukKeBukuKas;
      if (newDpAmount >= transaction.total_amount) {
        newDpAmount = transaction.total_amount;
        newStatus = 'Lunas';
      }
    }

    // Eksekusi Update Transaksi Utama
    await db.prepare(`
      UPDATE transactions 
      SET pickup_status = ?, pickup_notes = ?, dp_amount = ?, status = ?
      WHERE invoice_no = ?
    `).bind(pickup_status, finalNotes, newDpAmount, newStatus, invoiceNo).run();

    // SINKRONISASI SINGLE SOURCE OF TRUTH KE WORK_ORDERS
    if (pickup_status === 'Diambil' || pickup_status === 'Diambil Semua') {
      await db.prepare(`
        UPDATE work_orders 
        SET current_stage = 'Selesai', status = 'Diambil Semua', updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `).bind(transaction.id).run();
    } else if (pickup_status === 'Diambil Sebagian') {
      await db.prepare(`
        UPDATE work_orders 
        SET current_stage = 'Kasir', status = 'Diambil Sebagian', updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `).bind(transaction.id).run();
    }

    if (uangMasukKeBukuKas > 0) {
      await db.prepare(`
        INSERT INTO cash_flows (id, type, amount, description, flow_date, created_by)
        VALUES (?, 'MASUK', ?, ?, CURRENT_DATE, ?)
      `).bind(crypto.randomUUID(), uangMasukKeBukuKas, `Pelunasan Kasir: ${invoiceNo}`, context.data.user.sub).run();
    }

    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db, 
      context.data.user.sub, 
      'UPDATE_PICKUP_STATUS', 
      `Update invoice ${invoiceNo} -> Pengambilan: ${pickup_status}, Bayar Tambahan: Rp ${uangMasukKeBukuKas}, Status Bayar: ${newStatus}`, 
      ip
    );

    return new Response(JSON.stringify(formatResponse(true, { message: "Status pengambilan & pembayaran berhasil diperbarui" })));
  } catch (error) {
    console.error("PUT /api/transactions/[invoice_no] Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}