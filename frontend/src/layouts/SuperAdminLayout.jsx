// packages/frontend/src/layouts/SuperAdminLayout.jsx
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { LogOut, Users, LayoutDashboard, ShieldAlert, Database, Menu, X } from 'lucide-react';

export default function SuperAdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation(); // Untuk mendeteksi halaman aktif
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Daftar menu agar kodenya lebih bersih & gampang ditambah
  const menuItems = [
    { path: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/super-admin/users', icon: Users, label: 'Kelola Pengguna (Role)' },
    { path: '/super-admin/audit', icon: ShieldAlert, label: 'Sistem Audit Logs' }
  ];

  // SESUDAHNYA
    return (
    // Ganti min-h-screen menjadi h-screen dan tambahkan overflow-hidden
    <div className="h-screen overflow-hidden flex bg-slate-50 font-sans text-slate-800 relative">
      
      {/* Backdrop Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Hanya ditulis 1x di sini!) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="text-blue-400" size={20} />
            <span className="font-bold text-lg tracking-wide">SIMKEMAS Admin</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 cursor-pointer">
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Deteksi menu aktif secara otomatis!
            const isActive = location.pathname === item.path;
            
            return (
              <button 
                key={item.path}
                onClick={() => { setIsSidebarOpen(false); navigate(item.path); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} /> {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button variant="outline" onClick={logout} className="w-full border-slate-700 bg-slate-800/50 text-red-400 hover:bg-red-950/50 cursor-pointer justify-start gap-2">
            <LogOut size={16} /> Keluar Akun
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Global */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600 lg:hidden cursor-pointer">
              <Menu size={22} />
            </Button>
            {/* Judul dinamis diserahkan ke komponen anak saja, atau pasang title global */}
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Sistem Manajemen</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 hidden sm:inline">👋 {user?.username || 'Super Admin'}</span>
          </div>
        </header>

        {/* 👇 DI SINILAH HALAMAN ANAK (Dashboard/Users) AKAN DIRENDER 👇 */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet /> 
        </main>

      </div>
    </div>
  );
}