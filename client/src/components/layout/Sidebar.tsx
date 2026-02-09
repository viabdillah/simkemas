import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, X, PackageOpen } from 'lucide-react';
import { MENU_ITEMS } from '@/config/menu';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: any;
}

export default function Sidebar({ isOpen, onClose, onLogout, user }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const allowedMenus = MENU_ITEMS.filter(m => m.roles.includes(user?.role || ''));

  // 1. Mobile Style: Bottom Sheet (Naik/Turun)
  const mobileClasses = `fixed z-50 bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col         bottom-0 left-0 w-full max-h-[85vh] md:max-h-none rounded-t-3xl border-t border-slate-700 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`;
  
  // 2. Tablet Style: Drawer (Kiri/Kanan)
  // Reset Y-transform mobile, ganti dengan X-transform
  const tabletClasses = `md:top-0 md:left-0 md:h-full md:w-64 md:rounded-none md:border-r md:border-t-0 md:translate-y-0 ${isOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}`;
  
  // 3. Desktop Style: Static & Reset Transform
  // PENTING: 'lg:transform-none' wajib ada untuk membatalkan efek 'translate-y-full' dari mobile
  const desktopClasses = `        lg:static lg:h-screen lg:w-64 lg:transform-none lg:translate-x-0 lg:translate-y-0 lg:border-r lg:border-slate-800 lg:shadow-none`;

  return (
    <>
      {/* OVERLAY (Hanya muncul di Mobile/Tablet) */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* SIDEBAR CONTAINER */}
      {/* Gabungkan semua class */}
      <aside className={`${mobileClasses} ${tabletClasses} ${desktopClasses}`}>
        
        {/* Handle Bar (Mobile Only) */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
        </div>

        {/* Header Sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <PackageOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              SIMKEMAS
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* User Info (Mobile Only) */}
        <div className="px-4 py-4 md:hidden shrink-0">
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                {user?.name?.charAt(0)}
             </div>
             <div>
               <p className="font-medium text-white">{user?.name}</p>
               <p className="text-xs text-slate-400 uppercase">{user?.role}</p>
             </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
          <nav className="space-y-1">
            {allowedMenus.map((menu) => (
              <button
                key={menu.path}
                onClick={() => {
                  navigate(menu.path);
                  onClose(); 
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  location.pathname === menu.path 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <menu.icon size={20} className="mr-3" />
                {menu.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0 md:rounded-none">
          <button 
            onClick={onLogout} 
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Keluar Sistem
          </button>
        </div>
      </aside>
    </>
  );
}