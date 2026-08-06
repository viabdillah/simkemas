import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Wallet, Factory, Users, ShoppingBag, 
  LogOut, Menu, X, RefreshCw, Loader2, Layers 
} from 'lucide-react';

export default function DashboardManajer() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [data, setData] = useState({
    total_pendapatan: 0,
    total_spk_aktif: 0,
    total_mitra: 0,
    recentSpk: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // 1. FUNGSI API MURNI
  const fetchSummaryAPI = async () => {
    const res = await fetch('/api/manajer/summary');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat analitik manajer");
    return result.data;
  };

  // 2. EFFECT AMAN LINTER & MEMORY LEAK
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const result = await fetchSummaryAPI();
        if (isMounted) {
          setData(result || { total_pendapatan: 0, total_spk_aktif: 0, total_mitra: 0, recentSpk: [] });
        }
      } catch (err) {
        if (isMounted) toast.error(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  // 3. FUNGSI REFRESH MANUAL
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const result = await fetchSummaryAPI();
      setData(result || { total_pendapatan: 0, total_spk_aktif: 0, total_mitra: 0, recentSpk: [] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (angka) => `Rp ${(parseInt(angka) || 0).toLocaleString('id-ID')}`;

  return (
    <div className="h-[100dvh] bg-slate-100 flex font-sans overflow-hidden">
      
      {/* INLINE SIDEBAR MANAJER */}
      {/* Overlay untuk mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 shrink-0 shadow-2xl lg:shadow-none`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <span className="font-black text-xl tracking-tight text-white flex items-center gap-2">
            <Layers className="text-indigo-500" /> SIMKEMAS
          </span>
          <Button variant="ghost" size="icon" className="lg:hidden text-slate-400 hover:text-white cursor-pointer" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-inner">
              {user?.nama?.charAt(0) || 'M'}
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-slate-100">{user?.nama || 'Manajer'}</p>
              <p className="text-xs text-indigo-400 mt-1 font-medium">{user?.role || 'Manajemen'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Button variant="ghost" className="w-full justify-start text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
            <TrendingUp className="mr-3 h-5 w-5" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/manajer/laporan')}>
            <Wallet className="mr-3 h-5 w-5" /> Laporan Keuangan
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/manajer/produksi')}>
            <Factory className="mr-3 h-5 w-5" /> Pantau Produksi
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/manajer/mitra')}>
            <Users className="mr-3 h-5 w-5" /> Data Mitra
          </Button>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/30 cursor-pointer" onClick={logout}>
            <LogOut className="mr-3 h-5 w-5" /> Keluar
          </Button>
        </div>
      </aside>

      {/* AREA KANAN (KONTEN) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER UTAMA */}
        <header className="bg-white h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Menu size={22} />
            </Button>
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg tracking-tight lg:hidden">
              <Layers size={22} /> SIMKEMAS
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-semibold text-indigo-700 hidden sm:inline-block bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200">
              📊 Mode Executive
            </span>
          </div>
        </header>

        {/* AREA UTAMA WORKSPACE */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-[1700px] mx-auto w-full flex flex-col gap-6">
          
          {/* CARD HEADER (Terpadu) */}
          <Card className="border-slate-200 shadow-sm shrink-0 bg-white">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" /> Executive Dashboard
                </h1>
                <p className="text-sm text-slate-500 mt-1">Ringkasan performa bisnis, produksi, dan data mitra terkini.</p>
              </div>

              <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer w-full sm:w-auto">
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Data</span>
              </Button>
            </CardContent>
          </Card>

          {/* METRIK CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pendapatan</p>
                  {isLoading ? <div className="h-8 w-32 bg-slate-200 animate-pulse rounded"></div> : (
                    <p className="text-2xl font-black text-slate-800">{formatRp(data?.total_pendapatan)}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Wallet size={24} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SPK Aktif (Produksi)</p>
                  {isLoading ? <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div> : (
                    <p className="text-2xl font-black text-slate-800">{data?.total_spk_aktif || 0} <span className="text-sm font-medium text-slate-500">Antrean</span></p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Factory size={24} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mitra Terdaftar</p>
                  {isLoading ? <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div> : (
                    <p className="text-2xl font-black text-slate-800">{data?.total_mitra || 0} <span className="text-sm font-medium text-slate-500">UMKM</span></p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users size={24} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RECENT SPK TABLE */}
          <Card className="bg-white border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag size={20} className="text-indigo-600" /> Antrean SPK Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-6 py-4">Mitra & Invoice</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Progres Saat Ini</TableHead>
                    <TableHead className="text-right pr-6">Status Bayar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-indigo-600 h-8 w-8" /></TableCell></TableRow>
                  ) : !data?.recentSpk || data.recentSpk.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500 bg-slate-50/50">Pabrik sedang tidak memiliki antrean aktif.</TableCell></TableRow>
                  ) : (
                    data.recentSpk.map(spk => (
                      <TableRow key={spk.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="font-bold text-slate-800">{spk.umkm_name}</div>
                          <div className="font-mono text-xs text-slate-500 mt-0.5">{spk.invoice_no}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                            {new Date(spk.deadline).toLocaleDateString('id-ID')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 shadow-sm">
                            {spk.current_stage || 'Proses Pabrik'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge className={`${spk.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} border-0 shadow-sm`}>
                            {spk.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  );
}