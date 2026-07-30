import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../../_lib/rbac';

export async function onRequestGet(context) {
  const roleCheck = requireRole(context.data.user, ['Manajer', 'Kasir', 'Super Administrasi']);
  if (roleCheck) return roleCheck;

  try {
    const db = context.env.DB;

    // Agregasi UMKM berdasarkan histori transaksi
    const { results: customers } = await db.prepare(`
      SELECT 
        umkm_name,
        phone,
        COUNT(id) as total_orders,
        SUM(total_amount) as total_spend,
        MAX(created_at) as last_order_date
      FROM transactions
      GROUP BY umkm_name, phone
      ORDER BY total_orders DESC, total_spend DESC
    `).all();

    // Klasifikasi: Mitra Terdaftar (Order >= 2 atau Total Belanja >= Rp 5.000.000)
    const mitraList = [];
    const nonMitraList = [];

    customers.forEach(c => {
      if (c.total_orders >= 2 || c.total_spend >= 5000000) {
        mitraList.push({ ...c, status: 'Mitra Terdaftar' });
      } else {
        nonMitraList.push({ ...c, status: 'Pembeli Non-Mitra' });
      }
    });

    return new Response(JSON.stringify(formatResponse(true, {
      mitraList,
      nonMitraList,
      totalCustomers: customers.length
    })));
  } catch (error) {
    console.error("GET /api/customers Error:", error);
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan server")), { status: 500 });
  }
}