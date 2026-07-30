import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, Users, LayoutDashboard, ShieldAlert, Database, 
  Menu, X, Activity, Server 
} from 'lucide-react';

export default function DashboardSuperAdmin() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800 relative">
      
      {/* Backdrop Overlay (Untuk Mobile/Responsive Drawer) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Super Admin (Drawer) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header Sidebar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="text-blue-400" size={20} />
            <span className="font-bold text-lg tracking-wide">SIMKEMAS Admin</span>
          </div>
          {/* Tombol Close di Sidebar (Mobile/Tablet) */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={20} />
          </Button>
        </div>
        
        {/* Navigasi Menu (PATH SUDAH DIPERBAIKI MENJADI /super-admin/...) */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button 
            onClick={() => { setIsSidebarOpen(false); navigate('/super-admin'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-md font-medium text-sm transition-colors cursor-pointer"
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => { setIsSidebarOpen(false); navigate('/super-admin/users'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer"
          >
            <Users size={18} /> Kelola Pengguna (Role)
          </button>
          <button 
            onClick={() => { setIsSidebarOpen(false); navigate('/super-admin/audit'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer"
          >
            <ShieldAlert size={18} /> Sistem Audit Logs
          </button>
        </nav>

        {/* Footer Sidebar dengan Tombol Logout Tambahan */}
        <div className="p-4 border-t border-slate-800">
          <Button 
            variant="outline" 
            onClick={logout} 
            className="w-full border-slate-700 bg-slate-800/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 hover:border-red-900 justify-start gap-2 cursor-pointer"
          >
            <LogOut size={16} /> Keluar Akun
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Utama */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            {/* Tombol Hamburger Menu */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-600 hover:bg-slate-100 cursor-pointer lg:hidden"
              title="Buka Menu Sidebar"
            >
              <Menu size={22} />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Dashboard Panel Utama</h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 hidden sm:inline">
              👋 {user?.username || 'Super Admin'}
            </span>
            
            {/* Tombol Logout Pojok Kanan Atas */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout} 
              className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-1.5 cursor-pointer px-2 sm:px-3"
            >
              <LogOut size={16} /> 
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna Aktif</CardTitle>
                <Users className="text-blue-500" size={18} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-800">--</div>
                <p className="text-xs text-slate-400 mt-1">Pengguna Terdaftar</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas Hari Ini</CardTitle>
                <Activity className="text-purple-500" size={18} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-blue-600">--</div>
                <p className="text-xs text-slate-400 mt-1">Audit Log Terekam</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Server D1</CardTitle>
                <Server className="text-emerald-500" size={18} />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-black text-emerald-600 flex items-center gap-2 mt-1">
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
              <p>
                Sebagai <b>Super Administrasi</b>, Anda memiliki wewenang penuh atas konfigurasi dan pemantauan sistem SIMKEMAS:
              </p>
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
        </main>

      </div>
    </div>
  );
}