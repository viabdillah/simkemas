import { Navigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useEffect, useRef } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const location = useLocation();
  const alertShown = useRef(false); // Ref agar alert tidak muncul 2x (React Strict Mode issue)

  // Ambil user dari localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Cek apakah user memiliki akses
  const hasAccess = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!hasAccess && !alertShown.current) {
      alertShown.current = true;
      // Tampilkan Peringatan Keras
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak!',
        text: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
        confirmButtonColor: '#ef4444',
        timer: 3000
      });
    }
  }, [hasAccess]);

  // Jika tidak punya akses, lempar ke Dashboard
  if (!hasAccess) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Jika punya akses, tampilkan halaman aslinya
  return <>{children}</>;
}