import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

// Guards & Dispatcher
import AuthGuard from '@/guards/AuthGuard';
import GuestGuard from '@/guards/GuestGuard';
import RoleGuard from '@/guards/RoleGuard';
import RootDispatcher from '@/guards/RootDispatcher';

// Pages & Sub-Routes
import Login from '@/pages/auth/Login';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';
import KasirRoutes from '@/routes/KasirRoutes';
import DesainerRoutes from '@/routes/DesainerRoutes';
import OperatorMesinRoutes from '@/routes/OperatorMesinRoutes';
import OperatorPackagingRoutes from '@/routes/OperatorPackagingRoutes';
import ManajerRoutes from '@/routes/ManajerRoutes';

function App() {
  const { checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]); // Dependency array diisi checkAuth agar ESLint aman

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center text-primary">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className="font-medium animate-pulse">Memuat Sistem SIMKEMAS...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<AuthGuard />}>
          <Route path="/" element={<RootDispatcher />} />
          
          <Route element={<RoleGuard allowedRoles={['Super Administrasi']} />}>
            <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Kasir']} />}>
            <Route path="/kasir/*" element={<KasirRoutes />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Desainer']} />}>
            <Route path="/desainer/*" element={<DesainerRoutes />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Operator Mesin']} />}>
            <Route path="/mesin/*" element={<OperatorMesinRoutes />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Operator Packaging']} />}>
            <Route path="/packaging/*" element={<OperatorPackagingRoutes />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Manajer']} />}>
            <Route path="/manajer/*" element={<ManajerRoutes />} />
          </Route>
          
          {/* Nanti RoleGuard Kasir, Manajer, dll ditambahkan di sini */}
        </Route>
      </Routes>
      
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;