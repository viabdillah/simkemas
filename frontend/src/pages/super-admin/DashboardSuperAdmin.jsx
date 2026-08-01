import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, Server, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardSuperAdmin() {
  const [stats, setStats] = useState({ totalUsers: 0, todayLogs: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fungsi untuk menarik data dari API Backend
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        const result = await res.json();
        
        if (res.ok && result.ok) {
          setStats(result.data);
        } else {
          toast.error(result.error || "Gagal memuat statistik");
        }
      } catch (error) {
        console.error("Fetch Stats Error:", error);
        toast.error("Terjadi kesalahan koneksi ke server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []); // Array kosong = hanya dijalankan 1x saat halaman pertama kali dibuka

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        
        {/* Card 1: Total Pengguna */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna Aktif</CardTitle>
            <Users className="text-blue-500" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 flex items-center h-9">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : stats.totalUsers}
            </div>
            <p className="text-xs text-slate-400 mt-1">Pengguna Terdaftar</p>
          </CardContent>
        </Card>

        {/* Card 2: Aktivitas Hari Ini */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas Hari Ini</CardTitle>
            <Activity className="text-purple-500" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600 flex items-center h-9">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : stats.todayLogs}
            </div>
            <p className="text-xs text-slate-400 mt-1">Audit Log Terekam</p>
          </CardContent>
        </Card>

        {/* Card 3: Status Server (Visual Saja) */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Server D1</CardTitle>
            <Server className="text-emerald-500" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-emerald-600 flex items-center gap-2 mt-1 h-9">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Online & Normal
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base sm:text-lg text-slate-800">Selamat Datang di Panel Kendali SIMKEMAS</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-sm text-slate-600">
          <p>Sebagai <b>Super Administrasi</b>, Anda memiliki wewenang penuh atas konfigurasi dan pemantauan sistem SIMKEMAS:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 sm:ml-4">
            <li>Kelola daftar akun pengguna dan hak akses (*role*) karyawan.</li>
            <li>Pantau <b>Audit Log</b> aktivitas transaksi dan perubahan data di backend Cloudflare D1.</li>
            <li>Monitor statistik arus kas dan antrean produksi antar-divisi.</li>
          </ul>
          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-md text-xs sm:text-sm mt-4">
            💡 <b>Petunjuk Navigasi:</b> Klik menu di sebelah kiri untuk berpindah halaman.
          </div>
        </CardContent>
      </Card>
    </>
  );
}