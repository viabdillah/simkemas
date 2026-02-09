import { Hono } from 'hono';
import { AuthController } from '../controllers/authController';
import { verifyAuth, requireAdmin, rateLimit } from '../middlewares/auth'; // Kita akan buat rateLimit nanti
import { Bindings, Variables } from '../types';

const auth = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Pasang Rate Limiter hanya di endpoint Login
auth.post('/login', rateLimit, AuthController.login);
auth.get('/me', verifyAuth, AuthController.me);

export default auth;