import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Wallet, Factory, Users, ShoppingBag, 
  LogOut, Menu, X, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, Layers 
} from 'lucide-react';

export default function DashboardManajer() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = async () => {
    const res = await fetch('/api/manajer/summary');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat analitik manajer");
    return result.data;
  };

  useEffect(() => {
    fetchSummary()
      .then(setData)
      .catch(err => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchSummary()
      .then(setData)
      .catch(err => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  const formatRp = (val) => `Rp ${parseInt(val || 0).toLocaleString('id-ID')}`;

  const summary = data?.summary || {};
  const topKemasan = data?.topKemasan || [];
  const recentSpk = data?.recentSpk || [];

  const maxQtyKemasan = Math.max(...topKemasan.map(k => k.total_qty), 100);

  return (
    <div className="h-screen flex bg-slate-100 font-sans text-slate-800 relative overflow-hidden">
      
      {/* Backdrop Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation Manajer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-950 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-indigo-900/80">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-indigo-400" size={22} />
            <span className="font-extrabold text-lg tracking-wide text-indigo-50">SIMKEMAS Exec</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-indigo-300 hover:text-white hover:bg-indigo-900">
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button onClick={() => { setIsSidebarOpen(false); navigate('/manajer'); }} className="w-full flex items-center gap-3 px-3.5 py-3 bg-indigo-800/80 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer border border-indigo-700">
            <TrendingUp size={18} /> Executive Dashboard
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/manajer/keuangan'); }} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 hover:text-white rounded-lg font-medium text-sm transition-colors cursor-pointer">
            <Wallet size={18} /> Laporan Arus Kas
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/manajer/pembelian'); }} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 hover:text-white rounded-lg font-medium text-sm transition-colors cursor-pointer">
            <ShoppingBag size={18} /> Laporan Transaksi
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/manajer/mitra'); }} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 hover:text-white rounded-lg font-medium text-sm transition-colors cursor-pointer">
            <Users size={18} /> Database Mitra UMKM
          </button>
        </nav>

        <div className="p-4 border-t border-indigo-900/80">
          <Button variant="outline" onClick={logout} className="w-full h-11 border-indigo-800 bg-indigo-900/40 text-red-300 hover:bg-red-950/60 hover:text-red-200 justify-start gap-2 cursor-pointer">
            <LogOut size={16} /> Keluar Akun
          </Button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-600 hover:bg-slate-100 cursor-pointer">
              <Menu size={22} />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Panel Eksekutif & Analitik Manajer</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer bg-white">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <span className="hidden sm:inline text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full">
              👔 {user?.username || 'Manajer'}
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Omzet Bulan Ini</CardTitle>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={18} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-800">{isLoading ? <Loader2 className="animate-spin" size={20}/> : formatRp(summary.omzetBulanIni)}</div>
                <p className="text-xs text-slate-400 mt-1">{summary.trxBulanIni || 0} Total Transaksi Terbuat</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemasukan Arus Kas</CardTitle>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ArrowUpRight size={18} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-blue-700">{isLoading ? <Loader2 className="animate-spin" size={20}/> : formatRp(summary.totalPemasukan)}</div>
                <p className="text-xs text-slate-400 mt-1">Uang Masuk Terbuku</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengeluaran Operasional</CardTitle>
                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><ArrowDownRight size={18} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-red-600">{isLoading ? <Loader2 className="animate-spin" size={20}/> : formatRp(summary.totalPengeluaran)}</div>
                <p className="text-xs text-slate-400 mt-1">Netto: <span className="font-bold text-slate-700">{formatRp(summary.saldoNetto)}</span></p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">SPK Aktif di Pabrik</CardTitle>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Factory size={18} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-amber-600">{isLoading ? <Loader2 className="animate-spin" size={20}/> : summary.totalSpkMandek} <span className="text-sm font-normal text-slate-500">SPK</span></div>
                <p className="text-xs text-slate-400 mt-1">Sedang Diproses Tim</p>
              </CardContent>
            </Card>

          </div>

          {/* Section Charts & Pola Kemasan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Bar Kemasan Terlaris */}
            <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="text-indigo-600" size={18} /> Tren & Pola Jenis Kemasan Terlaris Bulan Ini
                </CardTitle>
                <CardDescription className="text-xs">Diurutkan berdasarkan total kuantitas unit (Pcs) yang dipesan oleh UMKM.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {isLoading ? (
                  <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>
                ) : topKemasan.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada data pesanan kemasan bulan ini.</p>
                ) : (
                  topKemasan.map((item, idx) => {
                    const percentage = Math.round((item.total_qty / maxQtyKemasan) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{item.jenis_kemasan || 'Kemasan Standar'}</span>
                          <span className="text-indigo-700 font-bold">{item.total_qty.toLocaleString('id-ID')} Pcs <span className="text-slate-400 font-normal">({item.total_item_order} Order)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div style={{ width: `${percentage}%` }} className="bg-indigo-600 h-full rounded-full transition-all duration-500" />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Breakdown Status SPK Pabrik */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Factory className="text-amber-600" size={18} /> Alokasi SPK Pabrik
                </CardTitle>
                <CardDescription className="text-xs">Distribusi beban kerja tiap divisi saat ini.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <span className="text-xs font-bold text-purple-900">🎨 Meja Desainer</span>
                  <Badge className="bg-purple-600 text-white font-bold">{summary.stageCounts?.Desainer || 0} SPK</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                  <span className="text-xs font-bold text-cyan-900">⚙️ Operator Mesin</span>
                  <Badge className="bg-cyan-600 text-white font-bold">{summary.stageCounts?.['Operator Mesin'] || 0} SPK</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-xs font-bold text-amber-900">📦 Operator Packaging</span>
                  <Badge className="bg-amber-600 text-white font-bold">{summary.stageCounts?.['Operator Packaging'] || 0} SPK</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <span className="text-xs font-bold text-teal-900">🛍️ Siap Diambil di Kasir</span>
                  <Badge className="bg-teal-600 text-white font-bold">{summary.stageCounts?.Kasir || 0} SPK</Badge>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Live Monitoring Table SPK Aktif */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-800">5 SPK Terbaru yang Sedang Berjalan</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate('/manajer/pembelian')} className="text-xs cursor-pointer">Lihat Semua Transaksi</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="pl-6">Invoice & UMKM</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Posisi Divisi Saat Ini</TableHead>
                      <TableHead className="text-right pr-6">Status SPK</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-indigo-600" /></TableCell></TableRow>
                    ) : recentSpk.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 text-xs">Pabrik sedang tidak memiliki antrean aktif.</TableCell></TableRow>
                    ) : (
                      recentSpk.map(spk => (
                        <TableRow key={spk.id} className="hover:bg-slate-50">
                          <TableCell className="pl-6">
                            <div className="font-bold text-slate-800">{spk.umkm_name}</div>
                            <div className="font-mono text-xs text-indigo-600">{spk.invoice_no}</div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-red-600">{spk.deadline}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-slate-100 text-slate-700">{spk.current_stage}</Badge></TableCell>
                          <TableCell className="text-right pr-6"><Badge className="bg-amber-500 text-white">{spk.status}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  );
}