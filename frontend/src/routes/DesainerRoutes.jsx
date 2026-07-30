import { Routes, Route } from 'react-router-dom';
import KanbanDesainer from '@/pages/desainer/KanbanDesainer';
import RiwayatDesainer from '@/pages/desainer/RiwayatDesainer'; // <-- Import ini

export default function DesainerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<KanbanDesainer />} />
      <Route path="/riwayat" element={<RiwayatDesainer />} /> {/* <-- Tambah ini */}
    </Routes>
  );
}