import { Routes, Route } from 'react-router-dom';
import DashboardSuperAdmin from '@/pages/super-admin/DashboardSuperAdmin';
import ManageUsers from '@/pages/super-admin/ManageUsers'; // Import halaman baru
import AuditLogs from '@/pages/super-admin/AuditLogs';

export default function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardSuperAdmin />} />
      <Route path="/users" element={<ManageUsers />} /> {/* Rute baru /super-admin/users */}
      <Route path="/audit" element={<AuditLogs />} />
    </Routes>
  );
}