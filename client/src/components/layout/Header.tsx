import { Menu, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  user: any;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
      
      <div className="flex items-center gap-4">
        {/* Hamburger: Muncul di Tablet (md), Hilang di Desktop & Mobile */}
        <button 
          onClick={onMenuClick}
          className="hidden md:block lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Logo Header: Sembunyikan di Desktop (lg:hidden) karena Sidebar sudah punya logo */}
        <h2 className="text-lg font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent lg:hidden">
          SIMKEMAS
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">{user?.name || 'User'}</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{user?.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}