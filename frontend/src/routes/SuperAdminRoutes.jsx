import { Routes, Route } from 'react-router-dom';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import DashboardSuperAdmin from '@/pages/super-admin/DashboardSuperAdmin';
import ManageUsers from '@/pages/super-admin/ManageUsers';
import AuditLogs from '@/pages/super-admin/AuditLogs';

export default function SuperAdminRoutes() {
  return (
    <Routes>
      {/* Semua rute di dalam blok ini otomatis akan dirender di dalam 
        <Outlet /> milik SuperAdminLayout 
      */}
      <Route element={<SuperAdminLayout />}>
        
        {/* URL: /super-admin */}
        <Route index element={<DashboardSuperAdmin />} />
        
        {/* URL: /super-admin/users */}
        <Route path="users" element={<ManageUsers />} />
        
        {/* URL: /super-admin/audit (Disiapkan untuk nanti) */}
        <Route path="/audit" element={<AuditLogs />} />

      </Route>
    </Routes>
  );
}