import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  History, RefreshCw, Loader2, Search, ExternalLink, 
  Package, Settings, Box, LogOut, LayoutDashboard, Menu, X 
} from 'lucide-react';

export default function RiwayatPackaging() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    // API yang sama dengan Mesin/Desainer, backend sudah handle role
    const res = await fetch('/api/work-orders?history=true');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat riwayat packing");
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
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800 relative">
      
      {/* Backdrop Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Package className="text-amber-600" size={22} />
            <span className="font-bold text-lg text-slate-800 tracking-wide">SIMKEMAS</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button onClick={() => { setIsSidebarOpen(false); navigate('/packaging'); }} className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-md font-medium text-sm transition-colors cursor-pointer">
            <LayoutDashboard size={18} /> Ruang Packing
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/packaging/riwayat'); }} className="w-full flex items-center gap-3 px-3 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-sm transition-colors cursor-pointer">
            <History size={18} /> Riwayat Packing
          </button>
          <button onClick={() => toast.info("Modul Stock Opname Kardus/Lakban segera hadir!")} className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-md font-medium text-sm transition-colors cursor-pointer">
            <Box size={18} /> Stock Opname Barang
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={logout} className="w-full h-12 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 justify-start gap-2 cursor-pointer shadow-sm">
            <LogOut size={16} /> Keluar Akun
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-slate-50/50">
        
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500 hover:bg-slate-100 cursor-pointer border border-slate-200">
              <Menu size={20} />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Riwayat Packaging</h1>
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">👋 {user?.username}</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                  <History className="text-amber-500" size={28} /> Arsip Pengiriman
                </h1>
                <p className="text-slate-500 text-sm mt-1">Daftar SPK yang telah selesai dipacking dan diserahkan ke Kasir (Siap Diambil).</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer bg-white shadow-sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
              </Button>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm text-slate-800">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input placeholder="Cari No. Invoice / Nama UMKM..." className="pl-10 h-11 bg-slate-50 border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 rounded-lg focus-visible:ring-amber-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                      <TableRow className="border-slate-200 hover:bg-transparent">
                        <TableHead className="text-slate-600 font-bold py-4 pl-6">Invoice & UMKM</TableHead>
                        <TableHead className="text-slate-600 font-bold">Rincian Kemasan</TableHead>
                        <TableHead className="text-slate-600 font-bold">Posisi SPK Saat Ini</TableHead>
                        <TableHead className="text-slate-600 font-bold">Tanggal Penyerahan</TableHead>
                        <TableHead className="text-right text-slate-600 font-bold pr-6">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow className="border-slate-100"><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-amber-500 h-8 w-8" /></TableCell></TableRow>
                      ) : filteredHistory.length === 0 ? (
                        <TableRow className="border-slate-100"><TableCell colSpan={5} className="text-center py-12 text-slate-500">Belum ada riwayat packing ditemukan.</TableCell></TableRow>
                      ) : (
                        filteredHistory.map((wo) => (
                          <TableRow key={wo.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <div className="font-bold text-slate-800 text-base">{wo.umkm_name}</div>
                              <div className="font-mono text-xs text-slate-500 mt-1">{wo.invoice_no}</div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1.5">
                                {wo.items?.map((item) => (
                                  <div key={item.id} className="text-xs text-slate-600">
                                    • {item.nama_kemasan} <span className="text-amber-600 font-bold ml-1">({item.qty} Pcs)</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1 px-3 shadow-sm">
                                {wo.current_stage} (Siap Diambil)
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(wo.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button size="sm" variant="outline" className="text-slate-600 hover:text-amber-700 hover:bg-amber-50 border-slate-200 cursor-pointer h-9 px-3 bg-white" onClick={() => window.open(`/kasir/spk/${wo.invoice_no}`, '_blank')}>
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