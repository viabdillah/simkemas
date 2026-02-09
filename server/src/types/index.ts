// server/src/types/index.ts

export type Role = 'admin' | 'kasir' | 'desainer' | 'operator' | 'manajer';

export interface UserPayload {
  id: number;
  username: string;
  role: Role;
  iat?: number; // Issued At (JWT standard)
  exp?: number; // Expiration (JWT standard)
}

// Interface untuk Env Vars di Cloudflare
export interface Bindings {
  DB: D1Database;
  JWT_SECRET: string;
}

// Interface untuk Context Variables (agar middleware bisa oper data ke controller)
export type Variables = {
  user: UserPayload;
}