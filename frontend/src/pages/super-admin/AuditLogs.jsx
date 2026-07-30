import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, Terminal, RefreshCw, LogOut, Users, LayoutDashboard, Database, Menu, X 
} from 'lucide-react';

export default function AuditLogs() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const terminalEndRef = useRef(null);

  const fetchLogs = async () => {
    const res = await fetch('/api/audit-logs');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error);
    return result.data.logs;
  };

  useEffect(() => {
    fetchLogs()
      .then(setLogs)
      .catch((err) => {
        console.error("Fetch Logs Error:", err);
        toast.error("Gagal memuat log sistem");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchLogs()
      .then(setLogs)
      .catch((err) => {
        console.error("Refresh Error:", err);
        toast.error("Gagal merefresh log");
      })
      .finally(() => setIsLoading(false));
  };

  // Efek auto-scroll ke bawah saat ada log baru
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800 relative">
      
      {/* Backdrop Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Super Admin */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="text-blue-400" size={20} />
            <span className="font-bold text-lg tracking-wide">SIMKEMAS Admin</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button onClick={() => { setIsSidebarOpen(false); navigate('/super-admin'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/super-admin/users'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <Users size={18} /> Kelola Pengguna (Role)
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/super-admin/audit'); }} className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <ShieldAlert size={18} /> Sistem Audit Logs
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button variant="outline" onClick={logout} className="w-full border-slate-700 bg-slate-800/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 hover:border-red-900 justify-start gap-2 cursor-pointer">
            <LogOut size={16} /> Keluar Akun
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600 hover:bg-slate-100 cursor-pointer lg:hidden">
              <Menu size={22} />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Sistem Audit</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 hidden sm:inline">👋 {user?.username || 'Super Admin'}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-1.5 cursor-pointer px-2 sm:px-3">
              <LogOut size={16} /> <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        {/* Page Content: Audit Logs */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50">
          <div className="space-y-6 max-w-7xl mx-auto">
            
            {/* Header Konten */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <ShieldAlert className="text-orange-500" size={28} />
                  Sistem Audit Log
                </h1>
                <p className="text-slate-500 text-sm mt-1">Pemantauan riwayat mutasi data dan aktivitas sistem secara real-time.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>

            {/* UI Terminal Container - REVISI: Menggunakan tinggi spesifik (h-[65vh]) agar bisa scroll di dalam! */}
            <div className="bg-[#0D1117] rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col font-mono text-sm h-[65vh] min-h-[400px]">
              
              {/* Terminal Header (Mac/Linux Style) */}
              <div className="h-10 bg-[#161B22] border-b border-slate-700 flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto flex items-center gap-2 text-slate-400 text-xs">
                  <Terminal size={14} /> simkemas-core@production:~
                </div>
              </div>

              {/* Terminal Body - Bagian ini yang akan scroll secara internal */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 text-slate-300 scroll-smooth">
                <div className="text-green-400 font-bold mb-4">
                  [SYS_INIT] Koneksi terhubung ke SIMKEMAS Audit Server. Menunggu riwayat log...
                </div>
                
                {isLoading ? (
                  <div className="text-yellow-400">Loading stream data...</div>
                ) : logs.length === 0 ? (
                  <div className="text-slate-500 italic">Belum ada riwayat aktivitas di dalam sistem.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="hover:bg-slate-800/50 px-1 py-0.5 rounded flex flex-col sm:flex-row gap-2 sm:gap-4 break-all">
                      <span className="text-blue-400 shrink-0">[{formatTime(log.created_at)}]</span>
                      <span className="text-purple-400 shrink-0 w-32 font-bold truncate">@{log.username || 'SYSTEM'}</span>
                      <span className="text-yellow-300 shrink-0">[{log.action}]</span>
                      <span className="text-slate-300">{log.details}</span>
                      {log.ip_address && <span className="text-slate-500 text-xs ml-auto shrink-0">IP:{log.ip_address}</span>}
                    </div>
                  ))
                )}

                {/* Animasi Kursor Terminal Menunggu (Blinking) */}
                <div className="pt-2 flex items-center gap-2 text-green-500">
                  <span>root@simkemas:~#</span>
                  <span className="w-2 h-4 bg-green-500 animate-pulse inline-block"></span>
                </div>
                
                {/* Auto Scroll Anchor */}
                <div ref={terminalEndRef} />
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}