import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * RoleGuard - Melindungi rute spesifik berdasarkan role user.
 * @param {Array} allowedRoles - Array berisi nama-nama role yang diizinkan masuk
 */
export default function RoleGuard({ allowedRoles }) {
  const { user } = useAuthStore();

  // Jika user belum login, biarkan AuthGuard yang menangani (fallback aman)
  if (!user) return <Navigate to="/login" replace />;

  // Jika role user saat ini TIDAK ADA di dalam daftar allowedRoles, tendang!
  if (!allowedRoles.includes(user.role)) {
    // Kita lempar ke root (nanti root yang akan mengarahkan ulang ke dashboard masing-masing)
    return <Navigate to="/" replace />;
  }

  // Jika role cocok, izinkan render komponen halamannya
  return <Outlet />;
}