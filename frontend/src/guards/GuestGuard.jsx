import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function GuestGuard() {
  const { user } = useAuthStore();

  // Kalau udah login tapi iseng buka URL /login, lempar paksa ke dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}