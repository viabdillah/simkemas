// server/src/utils/security.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../types';

export const Security = {
  // Hash password sebelum masuk DB
  async hashPassword(plain: string): Promise<string> {
    return await bcrypt.hash(plain, 10);
  },

  // Cek password saat login
  async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(plain, hashed);
  },

  // Buat Token JWT (Berlaku 24 jam)
  async signToken(payload: UserPayload, secret: string): Promise<string> {
    return await jwt.sign(payload, secret, { expiresIn: '4h' });
  },

  // Verifikasi Token
  async verifyToken(token: string, secret: string): Promise<UserPayload | null> {
    try {
      return (await jwt.verify(token, secret)) as UserPayload;
    } catch (error) {
      return null;
    }
  }
};