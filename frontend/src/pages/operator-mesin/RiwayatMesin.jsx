import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  History, RefreshCw, Loader2, Search, ExternalLink, 
  Printer, Settings, Wrench, LogOut, LayoutDashboard, Menu, X 
} from 'lucide-react';

export default function RiwayatMesin() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    const res = await fetch('/api/work-orders?history=true');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat riwayat mesin");
    return result.data.workOrders;
  };

  useEffect(() => {
    fetchHistory().then(setHistoryList).catch(err => toast.error(err.message)).finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchHistory().then(setHistoryList).catch(err => toast.error(err.message)).finally(() => setIsLoading(false));
  };

  const filteredHistory = historyList.filter(wo =>
    wo.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.umkm_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#0f172a] font-sans text-slate-100 relative">
      
      {/* Background Industrial */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      {/* Backdrop Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-cyan-900/30 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="text-cyan-400" size={20} />
            <span className="font-bold text-lg tracking-wide">SIMKEMAS</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button onClick={() => { setIsSidebarOpen(false); navigate('/mesin'); }} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <LayoutDashboard size={18} /> Ruang Mesin
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/mesin/riwayat'); }} className="w-full flex items-center gap-3 px-3 py-3 bg-cyan-800/80 text-white rounded-md font-medium text-sm transition-colors cursor-pointer border border-cyan-700">
            <History size={18} /> Riwayat Cetak
          </button>
          <button onClick={() => toast.info("Segera hadir!")} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <Settings size={18} /> Part Mesin
          </button>
          <button onClick={() => toast.info("Segera hadir!")} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <Wrench size={18} /> Maintenance
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button variant="outline" onClick={logout} className="w-full h-12 border-slate-700 bg-slate-800/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 justify-start gap-2 cursor-pointer">
            <LogOut size={16} /> Keluar Akun
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Header Area */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-cyan-900/50 bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-300 hover:bg-slate-800 cursor-pointer">
              <Menu size={22} />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-200 truncate">Riwayat Mesin</h1>
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-slate-400">👋 {user?.username}</span>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-900/50">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <History className="text-cyan-400" size={28} /> Arsip Produksi
                </h1>
                <p className="text-slate-400 text-sm mt-1">Daftar SPK yang telah selesai dicetak dan diteruskan ke divisi Packaging.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="border-cyan-900/50 text-cyan-300 hover:bg-cyan-900/50 cursor-pointer">
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
              </Button>
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-xl text-slate-100">
              <CardHeader className="pb-4 border-b border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <Input placeholder="Cari No. Invoice / Nama UMKM..." className="pl-10 h-12 bg-slate-950 border-slate-700 text-sm text-white placeholder:text-slate-600 rounded-lg focus-visible:ring-cyan-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-800/50 border-b border-slate-700">
                      <TableRow className="border-slate-700 hover:bg-transparent">
                        <TableHead className="text-slate-300 py-4 pl-6">Invoice & UMKM</TableHead>
                        <TableHead className="text-slate-300">Rincian Cetak</TableHead>
                        <TableHead className="text-slate-300">Posisi SPK Saat Ini</TableHead>
                        <TableHead className="text-slate-300">Tanggal Selesai</TableHead>
                        <TableHead className="text-right text-slate-300 pr-6">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow className="border-slate-800"><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-cyan-500 h-8 w-8" /></TableCell></TableRow>
                      ) : filteredHistory.length === 0 ? (
                        <TableRow className="border-slate-800"><TableCell colSpan={5} className="text-center py-12 text-slate-500">Belum ada riwayat cetak ditemukan.</TableCell></TableRow>
                      ) : (
                        filteredHistory.map((wo) => (
                          <TableRow key={wo.id} className="border-slate-800 hover:bg-slate-800/50">
                            <TableCell className="pl-6 py-4">
                              <div className="font-bold text-white text-base">{wo.umkm_name}</div>
                              <div className="font-mono text-xs text-cyan-500 mt-1">{wo.invoice_no}</div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1.5">
                                {wo.items?.map((item) => (
                                  <div key={item.id} className="text-xs text-slate-300">
                                    • {item.nama_kemasan} <span className="text-emerald-400 font-bold ml-1">({item.qty} Pcs)</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-cyan-950/60 text-cyan-300 border-cyan-800 py-1 px-3">
                                {wo.current_stage} ({wo.status})
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-400">
                              {new Date(wo.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer h-10 px-4" onClick={() => window.open(`/kasir/spk/${wo.invoice_no}`, '_blank')}>
                                <ExternalLink size={16} className="mr-2" /> Detail SPK
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}