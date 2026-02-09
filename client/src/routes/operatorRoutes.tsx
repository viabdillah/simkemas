import ProductionJob from '@/pages/operator/ProductionJob';
// Nanti bisa tambah halaman history operator

export const operatorRoutes = [
  {
    path: 'production/jobs',
    element: <ProductionJob />,
    roles: ['admin', 'operator']
  }
];