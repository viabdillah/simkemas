import { formatResponse } from '@simkemas/shared';
import { verifyJWT } from '../_lib/jwt';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Endpoint /api/health sengaja dihapus dari sini supaya masuk ke blokir dan butuh login
  const publicRoutes = ['/api/auth/login', '/api/auth/setup'];
  
  // Exact match menggunakan includes, bukan endsWith
  if (publicRoutes.includes(url.pathname)) {
    return next();
  }

  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) throw new Error("Akses ditolak: Anda belum login");

    const tokenMatch = cookieHeader.match(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/);
    const token = tokenMatch[1];
    if (!token) throw new Error("Akses ditolak: Token tidak ditemukan");

    // Tolak mentah-mentah jika environment JWT_SECRET tidak dikonfigurasi
    if (!env.JWT_SECRET) {
      console.error("CRITICAL ERROR: env.JWT_SECRET belum diset di server!");
      throw new Error("Konfigurasi server tidak valid");
    }
    
    const payload = await verifyJWT(token, env.JWT_SECRET);
    context.data = { user: payload };

    return next();

  } catch (error) {
    const isAuthError = error.message.includes("Akses ditolak");
    
    // Jangan spam console.error di server lokal kalau error-nya sekadar user belum login
    if (!isAuthError) {
      console.error("Middleware Error:", error); 
    }

    const errRes = formatResponse(
      false, 
      null, 
      isAuthError ? error.message : "Sesi tidak valid atau telah kedaluwarsa"
    );
    
    return new Response(JSON.stringify(errRes), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}