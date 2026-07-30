import { Routes, Route } from 'react-router-dom';
import DashboardManajer from '@/pages/manajer/DashboardManajer';
import LaporanKeuanganManajer from '@/pages/manajer/LaporanKeuanganManajer';
import LaporanPembelianManajer from '@/pages/manajer/LaporanPembelianManajer';
import DataMitraManajer from '@/pages/manajer/DataMitraManajer';
import WorkOrderPrint from '@/pages/kasir/WorkOrderPrint';

export default function ManajerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardManajer />} />
      <Route path="/keuangan" element={<LaporanKeuanganManajer />} />
      <Route path="/pembelian" element={<LaporanPembelianManajer />} />
      <Route path="/mitra" element={<DataMitraManajer />} />

      <Route path="/spk/:invoiceNo" element={<WorkOrderPrint />} />
    </Routes>
  );
}