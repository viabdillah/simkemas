import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, Users, FileText, ListOrdered, Wallet, Package, X, LogOut, ShieldCheck 
} from 'lucide-react';

export default function KasirSidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/kasir', icon: ShoppingCart, label: 'Transaksi Kasir (POS)' },
    { path: '/kasir/mitra', icon: Users, label: 'Data Mitra & Produk' },
    { path: '/kasir/riwayat', icon: FileText, label: 'Riwayat Nota & SPK' },
    { path: '/kasir/tunggu', icon: ListOrdered, label: 'Daftar Tunggu (Antrian)' },
    { path: '/kasir/keuangan', icon: Wallet, label: 'Pencatatan Arus Kas' },
  ];

  return (
    <>
      {/* Backdrop Overlay (Untuk HP, Tablet & Desktop saat Sidebar Terbuka) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Off-Canvas Sidebar (Disembunyikan secara default di semua layar agar Kasir Fokus) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5 text-primary font-bold text-lg">
            <Package size={22} className="text-primary" />
            <span className="tracking-tight text-slate-800">SIMKEMAS POS</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer rounded-lg"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                onClick={() => setIsOpen(false)} // Tutup sidebar otomatis saat menu diklik
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Profile & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 shrink-0 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200 shrink-0">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'K'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{user?.username || 'Kasir'}</div>
              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" /> Standar Kasir
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={logout} 
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 justify-start gap-2 text-xs font-bold h-9 cursor-pointer"
          >
            <LogOut size={15} /> Keluar Akun
          </Button>
        </div>
      </aside>
    </>
  );
}