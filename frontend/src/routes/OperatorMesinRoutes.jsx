import { Routes, Route } from 'react-router-dom';
import KanbanMesin from '@/pages/operator-mesin/KanbanMesin';
import RiwayatMesin from '@/pages/operator-mesin/RiwayatMesin';

export default function OperatorMesinRoutes() {
  return (
    <Routes>
      <Route path="/" element={<KanbanMesin />} />
      <Route path="/riwayat" element={<RiwayatMesin />} />
    </Routes>
  );
}