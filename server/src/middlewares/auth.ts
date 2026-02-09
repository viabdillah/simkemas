import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

// --- KONFIGURASI RATE LIMITER (Anti Brute Force) ---
const ipLimit = new Map<string, { count: number, lastAttempt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 Menit
const MAX_ATTEMPTS = 5; // Maksimal 5x percobaan

export const rateLimit = async (c: Context, next: Next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  
  const now = Date.now();
  const record = ipLimit.get(ip);

  if (record) {
    if (now - record.lastAttempt > WINDOW_MS) {
      // Reset jika sudah lewat waktu blokir
      ipLimit.set(ip, { count: 1, lastAttempt: now });
    } else {
      // Masih dalam periode blokir
      if (record.count >= MAX_ATTEMPTS) {
        return c.json({ 
          message: 'Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 15 menit.',
          remainingTime: Math.ceil((WINDOW_MS - (now - record.lastAttempt)) / 60000) + ' menit'
        }, 429);
      }
      record.count++;
      record.lastAttempt = now;
    }
  } else {
    ipLimit.set(ip, { count: 1, lastAttempt: now });
  }

  await next();
};


// --- AUTHENTICATION MIDDLEWARE ---

export const verifyAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized: Token tidak ditemukan' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // PERBAIKAN DI SINI: Tambahkan 'HS256' sebagai argumen ketiga
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    
    c.set('user', payload); 
    await next();
  } catch (e) {
    return c.json({ message: 'Unauthorized: Token tidak valid atau kadaluarsa' }, 401);
  }
};


// --- AUTHORIZATION MIDDLEWARE (RBAC) ---

export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get('user');
  
  if (user?.role !== 'admin') {
    return c.json({ message: 'Forbidden: Akses khusus Admin' }, 403);
  }
  
  await next();
};