import { Routes, Route } from 'react-router-dom';
import POSDashboard from '@/pages/kasir/POSDashboard';
import DataMitra from '@/pages/kasir/DataMitra';
import InvoicePrint from '@/pages/kasir/InvoicePrint';
import RiwayatTransaksi from '@/pages/kasir/RiwayatTransaksi'; // <-- Import
import WorkOrderPrint from '@/pages/kasir/WorkOrderPrint'; // <-- Import
import Keuangan from '@/pages/kasir/Keuangan'; // <-- Import
import DaftarTunggu from '@/pages/kasir/DaftarTunggu';


export default function KasirRoutes() {
  return (
    <Routes>
      <Route path="/" element={<POSDashboard />} />
      <Route path="/mitra" element={<DataMitra />} />
      <Route path="/invoice/:invoiceNo" element={<InvoicePrint />} />
      <Route path="/spk/:invoiceNo" element={<WorkOrderPrint />} />
      <Route path="/riwayat" element={<RiwayatTransaksi />} />
      <Route path="/keuangan" element={<Keuangan />} />
      <Route path="/tunggu" element={<DaftarTunggu />} />
    </Routes>
  );
}