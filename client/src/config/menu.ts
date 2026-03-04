import {
  LayoutDashboard, Users,
  Settings, ShoppingCart, Clock, Wallet, PenTool, History,
  Printer, Package, Layers, ShoppingBag, LineChart
} from 'lucide-react';

export const MENU_ITEMS = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'kasir', 'desainer', 'operator', 'manajer']
  },
  {
    label: 'Data Pelanggan',
    path: '/customers',
    icon: Users, // Import ikon Users dari lucide-react
    roles: ['admin', 'kasir']
  },
  {
    label: 'Pesanan Baru',
    path: '/orders/new',
    icon: ShoppingCart,
    roles: ['kasir', 'admin']
  },
  { label: 'Pengambilan Barang', path: '/pickup', icon: ShoppingBag, roles: ['admin', 'kasir', 'manajer'] },
  {
    label: 'Riwayat Pesanan',
    path: '/orders/history',
    icon: Clock, // Import Clock from lucide-react
    roles: ['kasir', 'admin']
  },
  {
    label: 'Keuangan',
    path: '/finance',
    icon: Wallet,
    roles: ['admin', 'manajer', 'kasir']
  },
  // Menu Desainer
  { label: 'Tugas Desain', path: '/design/jobs', icon: PenTool, roles: ['admin', 'desainer'] },
  { label: 'Riwayat Desain', path: '/design/history', icon: History, roles: ['admin', 'desainer'] },

  // Menu Operator
  { label: 'Operator Produksi', path: '/production/jobs', icon: Printer, roles: ['admin', 'operator'] },

  { label: 'Gudang Bahan Baku', path: '/inventory', icon: Package, roles: ['admin', 'operator'] },
  { label: 'Master Bahan Baku', path: '/master/materials', icon: Layers, roles: ['admin', 'operator'] },
  {
    label: 'Manajemen User',
    path: '/users',
    icon: Users,
    roles: ['admin']
  },
  { label: 'Master Kemasan', path: '/master/packaging', icon: Package, roles: ['admin', 'manajer'] },
  {
    label: 'Pengaturan',
    path: '/settings',
    icon: Settings,
    roles: ['admin']
  },
  {
    label: 'Laporan Keuangan',
    path: '/report-finansial',
    icon: LineChart,
    roles: ['admin', 'manajer']
  },
];