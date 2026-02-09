import UserManagement from '@/pages/admin/UserManagement';
import PackagingMaster from '@/pages/admin/PackagingMaster'; // Import baru
import FinancePage from '@/pages/admin/FinancePage';
import MaterialMaster from '@/pages/admin/MaterialMaster';
import InventoryPage from '@/pages/admin/InventoryPage';

export const adminRoutes = [
  {
    path: 'users',
    element: <UserManagement />,
    roles: ['admin']
  },
  {
    path: 'master/packaging', // Route baru
    element: <PackagingMaster />,
    roles: ['admin', 'manajer']
  },
  {
    path: 'finance', // URL: /finance
    element: <FinancePage />,
    roles: ['admin', 'manajer', 'kasir'] // Akses dibuka untuk 3 role ini
  },
  // Route Gudang Bahan Baku
  {
    path: 'inventory',
    element: <InventoryPage />,
    roles: ['admin', 'operator'] // Akses hanya Admin & Operator
  },
  
  // Route Master Data Bahan Baku
  {
    path: 'master/materials',
    element: <MaterialMaster />,
    roles: ['admin', 'operator'] // Akses hanya Admin & Operator
  }
];