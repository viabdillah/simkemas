import { formatResponse } from '@simkemas/shared';
import { requireRole } from '../_lib/rbac';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const user = context.data?.user;

    // 1. Cek Role via helper
    const roleCheck = requireRole(user, ['Super Administrasi']);
    if (roleCheck) return roleCheck; // Tendang kalau bukan Super Admin

    // 2. Cek Localhost
    if (url.hostname !== 'localhost') {
      return new Response(JSON.stringify(formatResponse(false, null, "Akses ditolak: Endpoint ini hanya untuk env lokal.")), { status: 403 });
    }

    const db = context.env.DB;
    const { results } = await db.prepare(
      "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%'"
    ).all();

    return new Response(JSON.stringify(formatResponse(true, { tables_found: results })), { headers: { 'Content-Type': 'application/json' }});

  } catch (error) {
    console.error("Health Check Error:", error); // (Step 5)
    return new Response(JSON.stringify(formatResponse(false, null, "Terjadi kesalahan pada server")), { status: 500 }); // (Step 5)
  }
}