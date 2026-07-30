import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Menu, X, LayoutDashboard, LogOut, Package } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Package size={24} />
            <span>SIMKEMAS</span>
          </div>
          <button className="md:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-md font-medium transition-colors">
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          {/* Menu lain bisa ditambahkan di sini nanti */}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-600 hover:text-primary transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="font-semibold text-slate-800 hidden sm:block">
              {user?.role} Panel
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800">{user?.username}</span>
              <span className="text-xs text-slate-500">{user?.role}</span>
            </div>
            <Button onClick={logout} variant="destructive" size="sm" className="gap-2">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}