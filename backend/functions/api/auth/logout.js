import { formatResponse } from '@simkemas/shared';

export async function onRequestPost(context) {
  try {
    const { request } = context;

    // Cek apakah hostname bukan localhost untuk menyematkan atribut 'Secure'
    const isSecure = (new URL(request.url)).hostname !== 'localhost' ? 'Secure;' : '';
    
    // Set Max-Age=0 agar browser langsung membuang cookie 'token'
    const cookieOptions = `HttpOnly; Path=/; SameSite=Strict; ${isSecure} Max-Age=0`;

    return new Response(
      JSON.stringify(formatResponse(true, { message: "Logout berhasil" })), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `token=; ${cookieOptions}`
        }
      }
    );

  } catch (error) {
    console.error("Logout Error:", error);
    return new Response(
      JSON.stringify(formatResponse(false, null, "Terjadi kesalahan pada server")), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}