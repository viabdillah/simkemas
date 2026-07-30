-- Hapus tabel kalau sudah ada (hati-hati jika nanti sudah ada data asli)
DROP TABLE IF EXISTS users;

-- Buat tabel users dengan struktur keamanan standar
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);