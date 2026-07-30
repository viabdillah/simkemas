import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function AuthGuard() {
  const { user } = useAuthStore();

  // Kalau nggak ada data user di state, lempar paksa balik ke login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kalau aman, izinkan render komponen anak-anaknya (Outlet)
  return <Outlet />;
}