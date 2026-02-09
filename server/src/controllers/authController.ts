// server/src/controllers/authController.ts
import { Context } from 'hono';
import { CustomValidator } from '../utils/validator';
import { Security } from '../utils/security';
import { Bindings, Variables } from '../types';

export const AuthController = {
  
  // LOGIN (Public)
  async login(c: Context<{ Bindings: Bindings }>) {
    const body = await c.req.json();

    // 1. Validasi Input
    const v = new CustomValidator(body);
    v.required('username').required('password');
    const validation = v.validate();

    if (!validation.isValid) {
      return c.json({ message: 'Data tidak lengkap', errors: validation.errors }, 400);
    }

    // 2. Cari User di DB (Hanya user yang aktif/belum dihapus)
    const { username, password } = body;
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL')
      .bind(username)
      .first<any>();

    if (!user) {
      return c.json({ message: 'Username atau password salah' }, 401);
    }

    // 3. Cek Password
    const isMatch = await Security.verifyPassword(password, user.password);
    if (!isMatch) {
      return c.json({ message: 'Username atau password salah' }, 401);
    }

    // 4. Generate Token
    const token = await Security.signToken({
      id: user.id,
      username: user.username,
      role: user.role
    }, c.env.JWT_SECRET);

    return c.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  },

  // ME (Cek Session)
  async me(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    const user = c.get('user');
    return c.json({ user });
  },

  // CREATE USER (Register)
  async register(c: Context<{ Bindings: Bindings, Variables: Variables }>) {
    const body = await c.req.json();

    // 1. Validasi Input Strict
    const v = new CustomValidator(body);
    v.required('name').min('name', 3)
     .required('username').min('username', 4)
     .required('email').isEmail('email')
     .required('password').min('password', 6)
     .required('role').isIn('role', ['admin', 'kasir', 'desainer', 'operator', 'manajer']);
    
    const validation = v.validate();
    if (!validation.isValid) {
      return c.json({ message: 'Validasi gagal', errors: validation.errors }, 400);
    }

    // 2. Cek Duplikasi
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .bind(body.username, body.email)
      .first();

    if (existing) {
      return c.json({ message: 'Username atau Email sudah terdaftar' }, 409);
    }

    // 3. Hash & Simpan
    const hashedPassword = await Security.hashPassword(body.password);
    
    try {
      await c.env.DB.prepare(
        'INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)'
      ).bind(body.name, body.username, body.email, hashedPassword, body.role).run();

      return c.json({ message: 'User baru berhasil didaftarkan', success: true }, 201);
    } catch (e) {
      return c.json({ message: 'Terjadi kesalahan server saat menyimpan user' }, 500);
    }
  },

  // GET USERS (List with Filter & Search)
  async getUsers(c: Context<{ Bindings: Bindings }>) {
    const showDeleted = c.req.query('deleted') === 'true';
    const search = c.req.query('search') || ''; // Ambil parameter search

    try {
      let query = 'SELECT id, name, username, email, role, created_at, deleted_at FROM users';
      const params: any[] = [];
      const conditions: string[] = [];

      // 1. Filter Sampah vs Aktif
      if (showDeleted) {
        conditions.push('deleted_at IS NOT NULL');
      } else {
        conditions.push('deleted_at IS NULL');
      }

      // 2. Filter Search (Jika ada ketikan)
      if (search) {
        // Cari di nama, username, atau role
        conditions.push('(name LIKE ? OR username LIKE ? OR role LIKE ?)');
        const likeTerm = `%${search}%`;
        params.push(likeTerm, likeTerm, likeTerm);
      }

      // Gabungkan Kondisi
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY created_at DESC';

      // Eksekusi dengan Parameter Binding (Aman dari SQL Injection)
      const { results } = await c.env.DB.prepare(query).bind(...params).all();
      return c.json({ users: results });
    } catch (e) {
      return c.json({ message: 'Gagal mengambil data user' }, 500);
    }
  },

  // UPDATE USER (Edit)
  async updateUser(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    const body = await c.req.json();

    // 1. Validasi
    const v = new CustomValidator(body);
    v.required('name').min('name', 3)
     .required('email').isEmail('email')
     .required('role').isIn('role', ['admin', 'kasir', 'desainer', 'operator', 'manajer']);
    
    // Validasi password hanya jika diisi (untuk ganti password)
    if (body.password && body.password.trim() !== "") {
       v.min('password', 6);
    }

    const validation = v.validate();
    if (!validation.isValid) {
      return c.json({ message: 'Validasi gagal', errors: validation.errors }, 400);
    }

    try {
      // 2. Cek User Eksis
      const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
      if (!existingUser) return c.json({ message: 'User tidak ditemukan' }, 404);

      // 3. Build Query Dinamis
      let query = 'UPDATE users SET name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP';
      const params = [body.name, body.email, body.role];

      // Jika password diisi, update hash password juga
      if (body.password && body.password.trim() !== "") {
        const hashedPassword = await Security.hashPassword(body.password);
        query += ', password = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE id = ?';
      params.push(id);

      // Eksekusi Update
      // Menggunakan spread operator (...) untuk params
      await c.env.DB.prepare(query).bind(...params).run();

      return c.json({ message: 'Data user berhasil diperbarui', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal update user (Email/Username mungkin duplikat)' }, 500);
    }
  },

  // SOFT DELETE (Pindah ke Sampah)
  async deleteUser(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    try {
      // Set deleted_at ke waktu sekarang
      await c.env.DB.prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
      return c.json({ message: 'User dipindahkan ke sampah', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal menghapus user' }, 500);
    }
  },

  // RESTORE (Pulihkan)
  async restoreUser(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    try {
      // Set deleted_at kembali ke NULL
      await c.env.DB.prepare('UPDATE users SET deleted_at = NULL WHERE id = ?').bind(id).run();
      return c.json({ message: 'User berhasil dipulihkan', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal memulihkan user' }, 500);
    }
  },

  // PERMANENT DELETE (Hapus Total)
  async permanentDeleteUser(c: Context<{ Bindings: Bindings }>) {
    const id = c.req.param('id');
    try {
      // Hapus baris dari tabel selamanya
      await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
      return c.json({ message: 'User dihapus permanen', success: true });
    } catch (e) {
      return c.json({ message: 'Gagal menghapus permanen' }, 500);
    }
  }
};