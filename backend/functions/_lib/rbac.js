import { formatResponse } from '@simkemas/shared';

/**
 * Utilitas untuk mengecek apakah user memiliki role yang diizinkan
 * @returns {Response|null} Mengembalikan Response error 403/401 jika gagal, atau null jika lolos
 */
export function requireRole(user, allowedRoles) {
  if (!user || !user.role) {
    return new Response(JSON.stringify(formatResponse(false, null, "Akses ditolak: Sesi tidak valid.")), { status: 401 });
  }
  
  if (!allowedRoles.includes(user.role)) {
    return new Response(JSON.stringify(formatResponse(false, null, "Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.")), { status: 403 });
  }
  
  return null; // Null berarti lolos pengecekan
}