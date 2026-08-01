import { formatResponse } from '@simkemas/shared';

export async function onRequestGet(context) {
  try {
    // Karena sudah melewati _middleware.js, context.data.user PASTI ada dan valid
    const tokenUser = context.data.user;
    const db = context.env.DB;

    // Kita hit database sekali lagi untuk mastiin user ini belum dihapus 
    // oleh Super Admin lain saat sesinya masih jalan (Security Check).
    const dbUser = await db.prepare(
  "SELECT id, username, role FROM users WHERE id = ? AND is_active = 1"
).bind(tokenUser.sub).first();

    if (!dbUser) {
      const errRes = formatResponse(false, null, "User tidak ditemukan di database");
      return new Response(JSON.stringify(errRes), { status: 401 });
    }

    const response = formatResponse(true, { user: dbUser });
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorResponse = formatResponse(false, null, `Server Error: ${error.message}`);
    return new Response(JSON.stringify(errorResponse), { status: 500 });
  }
}