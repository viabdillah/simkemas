import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';
import { insertAuditLog } from '../../_lib/audit';

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Desainer', 'Operator Mesin', 'Operator Packaging', 'Kasir', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const url = new URL(context.request.url);
    const targetStage = url.searchParams.get('stage');
    const isHistory = url.searchParams.get('history');
    const db = context.env.DB;

    // 1. VALIDASI WHITELIST (Defense in Depth)
    const VALID_STAGES = ['Desainer', 'Operator Mesin', 'Operator Packaging', 'Kasir', 'Selesai'];
    if (targetStage && !VALID_STAGES.includes(targetStage)) {
      return new Response(JSON.stringify(formatResponse(false, null, "Parameter stage tidak valid")), { status: 400 });
    }

    let query = `
      SELECT w.*, t.invoice_no, t.umkm_name, t.deadline, t.created_at as order_date
      FROM work_orders w
      JOIN transactions t ON w.transaction_id = t.id
    `;
    
    // Array untuk menampung parameter yang akan di-bind
    let bindValues = [];

    if (isHistory === 'true') {
      const userRole = context.data.user.role;
      
      // Role-based filter menggunakan hardcoded strings (Aman dari SQL Injection)
      if (userRole === 'Desainer') {
        query += ` WHERE w.current_stage != 'Desainer'`;
      } else if (userRole === 'Operator Mesin') {
        query += ` WHERE w.current_stage != 'Desainer' AND w.current_stage != 'Operator Mesin'`;
      } else if (userRole === 'Operator Packaging') {
        query += ` WHERE w.current_stage IN ('Kasir', 'Selesai')`; 
      } else if (userRole === 'Kasir') {
        query += ` WHERE w.current_stage = 'Selesai'`; 
      } else {
        query += ` WHERE w.current_stage != 'Desainer'`; 
      }
      
      query += ` ORDER BY w.updated_at DESC`;
      
    } else if (targetStage) {
      // 2. FIX SQL INJECTION: Gunakan placeholder (?)
      query += ` WHERE w.current_stage = ?`;
      bindValues.push(targetStage);
      query += ` ORDER BY t.created_at ASC`;
    } else {
      query += ` ORDER BY t.created_at ASC`;
    }

    // Persiapkan statement D1 dan bind array (jika ada isinya)
    let stmt = db.prepare(query);
    if (bindValues.length > 0) {
      stmt = stmt.bind(...bindValues);
    }
    
    const { results } = await stmt.all();

    // Mengambil item-item SPK (sudah menggunakan binding ? dari awal, jadi aman)
    const stmtItems = db.prepare("SELECT * FROM transaction_items WHERE transaction_id = ?");
    const enhancedResults = await Promise.all(results.map(async (wo) => {
      const { results: items } = await stmtItems.bind(wo.transaction_id).all();
      return { ...wo, items };
    }));

    return new Response(JSON.stringify(formatResponse(true, { workOrders: enhancedResults })));
  } catch (error) {
    console.error("GET /api/work-orders Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}

export async function onRequestPut(context) {
  // 1. FIX BROKEN ACCESS CONTROL: Wajibkan pengecekan Role (Kasir TIDAK termasuk)
  const roleCheck = requireRole(context.data.user, ['Desainer', 'Operator Mesin', 'Operator Packaging', 'Manajer', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const body = await context.request.json();
    const { workOrderId, newStatus, newStage } = body;
    const db = context.env.DB;
    const user = context.data.user;
    const userId = user.sub;
    const userRole = user.role;

    // 2. MAPPING VALIDASI STATUS PER STAGE (Data Integrity)
    const VALID_STATUS_PER_STAGE = {
      'Desainer':           ['Menunggu', 'Dikerjakan', 'Revisi'],
      'Operator Mesin':     ['Menunggu', 'Dikerjakan', 'Kendala'],
      'Operator Packaging': ['Menunggu', 'Dikerjakan', 'Kendala'],
      'Kasir':              ['Siap Diambil'], // status hand-off dari Packaging
    };

    // 3. MAPPING URUTAN HAND-OFF (Perpindahan Stage)
    const HANDOFF_NEXT_STAGE = {
      'Desainer':           'Operator Mesin',
      'Operator Mesin':     'Operator Packaging',
      'Operator Packaging': 'Kasir',
    };

    // 4. Ambil current_stage yang SEBENARNYA dari database
    const wo = await db.prepare(`
      SELECT w.current_stage, t.invoice_no 
      FROM work_orders w 
      JOIN transactions t ON w.transaction_id = t.id 
      WHERE w.id = ?
    `).bind(workOrderId).first();

    if (!wo) {
      return new Response(JSON.stringify(formatResponse(false, null, "SPK tidak ditemukan")), { status: 404 });
    }

    const isSupervisor = userRole === 'Manajer' || userRole === 'Super Administrasi';

    // 5. VALIDASI KETAT UNTUK ROLE PEKERJA (Bukan Supervisor)
    if (!isSupervisor) {
      // a. Role harus sama persis dengan posisi SPK saat ini
      if (userRole !== wo.current_stage) {
        return new Response(JSON.stringify(formatResponse(false, null, `Akses ditolak: SPK ini bukan di tahap Anda (Saat ini: ${wo.current_stage})`)), { status: 403 });
      }

      // b. Request hanya boleh untuk "Same-Stage Update" ATAU "Hand-off ke next stage"
      const isSameStage = newStage === wo.current_stage;
      const isHandOff = newStage === HANDOFF_NEXT_STAGE[wo.current_stage];

      if (!isSameStage && !isHandOff) {
        return new Response(JSON.stringify(formatResponse(false, null, "Perpindahan stage tidak valid")), { status: 403 });
      }

      // c. Validasi newStatus harus legal di dalam newStage tujuan
      const validStatuses = VALID_STATUS_PER_STAGE[newStage];
      if (!validStatuses || !validStatuses.includes(newStatus)) {
        return new Response(JSON.stringify(formatResponse(false, null, `Status '${newStatus}' tidak valid untuk tahap '${newStage}'`)), { status: 400 });
      }
    } 
    // 6. VALIDASI UNTUK SUPERVISOR (Bebas pindah stage, tapi status wajib valid)
    else {
      const validStatuses = VALID_STATUS_PER_STAGE[newStage];
      if (validStatuses && !validStatuses.includes(newStatus)) {
        return new Response(JSON.stringify(formatResponse(false, null, `Status '${newStatus}' tidak valid untuk tahap '${newStage}'`)), { status: 400 });
      }
    }

    // 7. Eksekusi UPDATE ke Database
    await db.prepare(`
      UPDATE work_orders 
      SET status = ?, current_stage = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newStatus, newStage, workOrderId).run();

    // 8. Catat Audit Log HANYA untuk aksi yang sukses
    const ip = context.request.headers.get('CF-Connecting-IP') || 'Local';
    await insertAuditLog(
      db, 
      userId, 
      'UPDATE_WORK_ORDER', 
      `SPK ${wo.invoice_no} di-update -> Divisi: ${newStage}, Status: ${newStatus}`, 
      ip
    );

    return new Response(JSON.stringify(formatResponse(true, { message: "Status SPK berhasil diperbarui" })));
  } catch (error) {
    console.error("PUT /api/work-orders Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}