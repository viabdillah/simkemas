import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Swal from 'sweetalert2';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  useIdleTimer();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/login');
  }, [navigate]);

  const handleLogout = () => {
    setSidebarOpen(false); 
    Swal.fire({
      title: 'Keluar sistem?',
      text: "Sesi anda akan berakhir",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Keluar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate('/login');
      }
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* 1. SIDEBAR */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={handleLogout}
        user={user}
      />

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          user={user} 
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative scroll-smooth">
           <div className="absolute top-0 left-0 w-full h-40 bg-linear-to-b from-blue-100/40 to-transparent -z-10 pointer-events-none"></div>
           
           <Outlet /> 
           
           {/* Spacer Bawah (Mobile) */}
           <div className="h-24 md:hidden"></div>
        </main>

        {/* FAB (Mobile Only) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-transform duration-200"
        >
          <Menu size={28} />
        </button>

      </div>
    </div>
  );
}