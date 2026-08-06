import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Factory, TrendingUp, Wallet, Users, LogOut, Menu, X, 
  RefreshCw, Loader2, Calendar, ExternalLink, Search, Layers 
} from 'lucide-react';

export default function LaporanPembelianManajer() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Filter & Search
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString());
  const [searchQuery, setSearchQuery] = useState('');

  // State Data
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. FUNGSI API MURNI
  const fetchTransactionsAPI = async () => {
    const res = await fetch('/api/transactions?history=true');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat data produksi");
    return result.data.transactions || result.data || [];
  };

  // 2. INITIAL LOAD & EFFECT (Bebas Linter & Aman dari Memory Leak)
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await fetchTransactionsAPI();
        if (isMounted) setTransactions(data);
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
      const data = await fetchTransactionsAPI();
      setTransactions(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIKA FILTER & SORTING
  const filteredData = useMemo(() => {
    let result = [...transactions];

    const targetMonth = parseInt(selectedMonth) - 1;
    const targetYear = parseInt(selectedYear);

    // Filter by Bulan & Tahun
    result = result.filter(t => {
      const orderDate = new Date(t.created_at || t.order_date || new Date());
      return orderDate.getMonth() === targetMonth && orderDate.getFullYear() === targetYear;
    });

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.invoice_no || '').toLowerCase().includes(q) ||
        (t.umkm_name || '').toLowerCase().includes(q) ||
        (t.phone || '').includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [transactions, selectedMonth, selectedYear, searchQuery]);

  const formatRp = (angka) => `Rp ${(parseInt(angka) || 0).toLocaleString('id-ID')}`;

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="h-[100dvh] bg-slate-100 flex font-sans overflow-hidden">
      
      {/* INLINE SIDEBAR MANAJER */}
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
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/manajer/dashboard')}>
            <TrendingUp className="mr-3 h-5 w-5" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/manajer/laporan')}>
            <Wallet className="mr-3 h-5 w-5" /> Laporan Keuangan
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
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
            <CardContent className="p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Factory className="text-indigo-600" /> Pantau Produksi & Pesanan
                </h1>
                <p className="text-sm text-slate-500 mt-1">Lacak status pengerjaan SPK dan riwayat pesanan pabrik per bulan.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                
                {/* Search Input */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    placeholder="Cari Invoice / Nama..." 
                    className="pl-9 bg-slate-50 w-full border-slate-200 h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 w-full sm:w-auto shrink-0">
                  <Calendar size={14} className="text-slate-500 ml-2" />
                  <Select value={selectedMonth} onValueChange={(val) => { setIsLoading(true); setSelectedMonth(val); setTimeout(handleRefresh, 100); }}>
                    <SelectTrigger className="w-full sm:w-28 h-7 text-xs font-semibold border-none bg-transparent shadow-none focus:ring-0">
                      <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {namaBulan.map((b, idx) => (
                        <SelectItem key={idx + 1} value={(idx + 1).toString()}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <Select value={selectedYear} onValueChange={(val) => { setIsLoading(true); setSelectedYear(val); setTimeout(handleRefresh, 100); }}>
                    <SelectTrigger className="w-full sm:w-20 h-7 text-xs font-semibold border-none bg-transparent shadow-none focus:ring-0">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Tombol Aksi */}
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer w-full sm:w-auto h-9">
                  <RefreshCw className={`h-3.5 w-3.5 sm:mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AREA TABEL TRANSAKSI / PRODUKSI */}
          <Card className="bg-white border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/50 shrink-0">
              <CardTitle className="text-base font-bold text-slate-800">
                Daftar Pesanan ({namaBulan[parseInt(selectedMonth) - 1]} {selectedYear})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-100">
                  <TableRow>
                    <TableHead className="pl-6 py-4">Tgl & Invoice</TableHead>
                    <TableHead>UMKM / Pemesan</TableHead>
                    <TableHead>Nilai Tagihan</TableHead>
                    <TableHead>Status Pembayaran</TableHead>
                    <TableHead>Progres Pengerjaan</TableHead>
                    <TableHead className="text-right pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-indigo-600 h-8 w-8" /></TableCell></TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500 bg-slate-50/50">Tidak ada data pesanan di periode ini.</TableCell></TableRow>
                  ) : (
                    filteredData.map(t => (
                      <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="text-xs text-slate-500 mb-0.5">
                            {new Date(t.created_at || new Date()).toLocaleDateString('id-ID')}
                          </div>
                          <div className="font-mono font-bold text-slate-800">{t.invoice_no}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-bold text-slate-800">{t.umkm_name}</div>
                          <div className="text-xs text-slate-500">{t.phone}</div>
                        </TableCell>
                        <TableCell className="font-bold text-indigo-700">{formatRp(t.total_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`border-0 shadow-sm ${t.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.current_stage === 'Selesai' ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">✅ Selesai</Badge>
                          ) : t.current_stage === 'Kasir' ? (
                            <Badge className="bg-teal-50 text-teal-700 border-teal-200 shadow-sm">🛍️ Siap Diambil</Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-sm">⏳ {t.current_stage || 'Proses Pabrik'}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {/* Kita pinjam route cetak SPK Kasir untuk Manajer melihat rincian */}
                          <Button variant="outline" size="sm" className="text-indigo-600 hover:bg-indigo-50 border-indigo-200 cursor-pointer shadow-sm" onClick={() => window.open(`/kasir/spk/${t.invoice_no}`, '_blank')}>
                            <ExternalLink size={14} className="mr-1.5"/> Lihat SPK
                          </Button>
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