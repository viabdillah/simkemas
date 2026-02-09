import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import RoleGuard from '@/components/auth/RoleGuard';

// Import Config Routes
import { adminRoutes } from '@/routes/adminRoutes';
import { cashierRoutes } from '@/routes/cashierRoutes';
import InvoicePrint from '@/pages/cashier/InvoicePrint';
import { designerRoutes } from '@/routes/designerRoutes';
import { operatorRoutes } from '@/routes/operatorRoutes';

// Placeholder Dashboard Home
const DashboardHome = () => (
  <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
    <h1 className="text-2xl font-bold text-slate-800 mb-2">Dashboard</h1>
    <p className="text-slate-500">Selamat datang di sistem SIMKEMAS.</p>
  </div>
);

function App() {
  // Gabungkan semua route yang perlu diproteksi
  const appRoutes = [...adminRoutes, ...cashierRoutes, ...designerRoutes, ...operatorRoutes];

  return (
    <BrowserRouter>
      <Routes>
        {/* Route Public */}
        <Route path="/login" element={<LoginPage />} />

        <Route 
          path="/invoice/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'kasir']}>
              <InvoicePrint />
            </RoleGuard>
          } 
        />

        {/* Route Protected (Dashboard Layout) */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          
          {/* Loop untuk generate Route secara dinamis */}
          {appRoutes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={
                <RoleGuard allowedRoles={route.roles}>
                  {route.element}
                </RoleGuard>
              }
            />
          ))}

          {/* Fallback 404 */}
          <Route path="*" element={<div className="p-8 text-slate-500">Halaman tidak ditemukan</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;