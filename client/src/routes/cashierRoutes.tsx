import CustomerManagement from '@/pages/cashier/CustomerManagement';
import CustomerDetail from '@/pages/cashier/CustomerDetail';
import OrderEntry from '@/pages/cashier/OrderEntry';
import OrderHistory from '@/pages/cashier/OrderHistory'; // Baru
import PickupPage from '@/pages/cashier/PickupPage';

export const cashierRoutes = [
  {
    path: 'customers',
    element: <CustomerManagement />,
    roles: ['admin', 'kasir']
  },
  {
    path: 'customers/:id',
    element: <CustomerDetail />,
    roles: ['admin', 'kasir']
  },
  {
    path: 'orders/new', // Route Pesanan Baru
    element: <OrderEntry />,
    roles: ['admin', 'kasir']
  },
  {
    path: 'orders/history',
    element: <OrderHistory />,
    roles: ['admin', 'kasir']
  },
  {
    path: 'pickup',
    element: <PickupPage />,
    roles: ['admin', 'kasir', 'manajer'] // Sesuai request
  },
  // HALAMAN INVOICE (Diakses via window.open)
];