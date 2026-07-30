import { Routes, Route } from 'react-router-dom';
import KanbanPackaging from '@/pages/operator-packaging/KanbanPackaging';
import RiwayatPackaging from '@/pages/operator-packaging/RiwayatPackaging';

export default function OperatorPackagingRoutes() {
  return (
    <Routes>
      <Route path="/" element={<KanbanPackaging />} />
      <Route path="/riwayat" element={<RiwayatPackaging />} />
    </Routes>
  );
}