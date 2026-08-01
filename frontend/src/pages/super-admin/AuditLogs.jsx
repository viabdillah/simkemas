import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, Terminal, RefreshCw
} from 'lucide-react';

export default function AuditLogs() {
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

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