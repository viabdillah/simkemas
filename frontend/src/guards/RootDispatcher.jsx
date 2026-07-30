import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function RootDispatcher() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  // Arahkan ke rute spesifik berdasarkan role
  switch (user.role) {
    case 'Super Administrasi':
      return <Navigate to="/super-admin" replace />;
    case 'Kasir':
      return <Navigate to="/kasir" replace />;
    case 'Desainer':
        return <Navigate to="/desainer" replace />;
    case 'Operator Mesin':
        return <Navigate to="/mesin" replace />;
    case 'Operator Packaging':
        return <Navigate to="/packaging" replace />;
    case 'Manajer':
        return <Navigate to="/manajer" replace />;
    default:
      // Fallback jika role tidak dikenali
      return <Navigate to="/login" replace />;
  }
}