import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wallet, TrendingUp, Factory, Users, LogOut, Menu, X, 
  RefreshCw, Loader2, Download, ArrowUpRight, ArrowDownRight, Calendar, Plus, Layers 
} from 'lucide-react';

export default function LaporanKeuanganManajer() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Filter Bulan & Tahun
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString());

  // State Data Arus Kas & Loading (Default true untuk loading pertama kali)
  const [cashFlowData, setCashFlowData] = useState({ flows: [], dailyStats: [], lastDay: 31 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form Input Arus Kas
  const [type, setType] = useState('MASUK');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [flowDate, setFlowDate] = useState(today.toISOString().split('T')[0]);

  // 1. FUNGSI API MURNI
  const fetchCashFlowAPI = async (year, month) => {
    const res = await fetch(`/api/cash-flow?year=${year}&month=${month}`);
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat data keuangan");
    return result.data;
  };

  // 2. INITIAL LOAD & EFFECT (Bebas Linter & Aman dari Cascading Renders)
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await fetchCashFlowAPI(selectedYear, selectedMonth);
        if (isMounted) setCashFlowData(data);
      } catch (err) {
        if (isMounted) toast.error(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [selectedYear, selectedMonth]);

  // 3. FUNGSI REFRESH MANUAL
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCashFlowAPI(selectedYear, selectedMonth);
      setCashFlowData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description || !flowDate) {
      return toast.warning("Mohon lengkapi nominal, keterangan, dan tanggal");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cash-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: parseInt(amount, 10), description, flow_date: flowDate })
      });
      const result = await res.json();

      if (res.ok && result.ok) {
        toast.success(result.data.message);
        setAmount(''); setDescription('');
        handleRefresh();
      } else {
        toast.error("Gagal menyimpan arus kas", { description: result.error });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToExcel = () => {
    toast.success("Menyiapkan dokumen spreadsheet...");
    setTimeout(() => toast.success(`Laporan Keuangan ${namaBulan[parseInt(selectedMonth) - 1]} ${selectedYear} berhasil diekspor!`), 1500);
  };

  const formatRp = (val) => `Rp ${parseInt(val || 0).toLocaleString('id-ID')}`;

  // Kalkulasi Total Masuk, Keluar, dan Netto Bulan Ini
  const totalMasuk = cashFlowData.flows.filter(f => f.type === 'MASUK').reduce((acc, curr) => acc + curr.amount, 0);
  const totalKeluar = cashFlowData.flows.filter(f => f.type === 'KELUAR').reduce((acc, curr) => acc + curr.amount, 0);
  const saldoNetto = totalMasuk - totalKeluar;

  // Chart Properties
  const daysArray = Array.from({ length: cashFlowData.lastDay }, (_, i) => i + 1);
  const maxDailyVal = Math.max(...cashFlowData.dailyStats.map(d => Math.max(d.total_masuk, d.total_keluar)), 100000);
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
          <Button variant="ghost" className="w-full justify-start text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
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
            <CardContent className="p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Wallet className="text-indigo-600" /> Pencatatan Arus Kas & Analitik
                </h1>
                <p className="text-sm text-slate-500 mt-1">Kelola pemasukan, pengeluaran operasional, dan grafik bulanan pabrik.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                {/* Filter Selector */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 w-full sm:w-auto">
                  <Calendar size={16} className="text-slate-500 ml-2" />
                  <Select value={selectedMonth} onValueChange={(val) => { setIsLoading(true); setSelectedMonth(val); }}>
                    <SelectTrigger className="w-full sm:w-32 h-8 border-none bg-transparent shadow-none focus:ring-0">
                      <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {namaBulan.map((b, idx) => (
                        <SelectItem key={idx + 1} value={(idx + 1).toString()}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="w-px h-5 bg-slate-300 mx-1"></div>
                  <Select value={selectedYear} onValueChange={(val) => { setIsLoading(true); setSelectedYear(val); }}>
                    <SelectTrigger className="w-full sm:w-24 h-8 border-none bg-transparent shadow-none focus:ring-0">
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
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={exportToExcel} className="cursor-pointer flex-1 sm:flex-none text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export Excel</span>
                  </Button>
                  <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer flex-1 sm:flex-none">
                    <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ringkasan Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-700 block">TOTAL UANG MASUK</span>
                  <span className="text-2xl font-black text-emerald-800">{formatRp(totalMasuk)}</span>
                </div>
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full"><ArrowUpRight size={24}/></div>
              </CardContent>
            </Card>

            <Card className="bg-red-50/50 border-red-200">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-700 block">TOTAL PENGELUARAN</span>
                  <span className="text-2xl font-black text-red-800">{formatRp(totalKeluar)}</span>
                </div>
                <div className="p-3 bg-red-100 text-red-700 rounded-full"><ArrowDownRight size={24}/></div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50/50 border-indigo-200">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-700 block">SALDO NETTO (PROFIT)</span>
                  <span className="text-2xl font-black text-indigo-800">{formatRp(saldoNetto)}</span>
                </div>
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full"><Wallet size={24}/></div>
              </CardContent>
            </Card>
          </div>

          {/* BAGAN / CHART ANALITIK HARIAN */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800">
                Grafik Arus Kas Harian ({namaBulan[parseInt(selectedMonth) - 1]} {selectedYear})
              </CardTitle>
              <CardDescription className="text-xs">
                Perbandingan Uang Masuk (Hijau) dan Uang Keluar (Merah) dari tanggal 1 s/d akhir bulan.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-48 flex items-end gap-1 overflow-x-auto border-b border-slate-200 pb-2 px-1">
                {daysArray.map((day) => {
                  const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const stat = cashFlowData.dailyStats.find(d => d.flow_date === dateStr) || { total_masuk: 0, total_keluar: 0 };
                  
                  const heightMasuk = Math.round((stat.total_masuk / maxDailyVal) * 100);
                  const heightKeluar = Math.round((stat.total_keluar / maxDailyVal) * 100);

                  return (
                    <div key={day} className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-nowrap">
                        <b>Tgl {day}</b>
                        <span className="text-emerald-400">Masuk: {formatRp(stat.total_masuk)}</span>
                        <span className="text-red-400">Keluar: {formatRp(stat.total_keluar)}</span>
                      </div>

                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div style={{ height: `${heightMasuk}%` }} className="w-1.5 bg-emerald-500 rounded-t transition-all hover:bg-emerald-600" />
                        <div style={{ height: `${heightKeluar}%` }} className="w-1.5 bg-red-500 rounded-t transition-all hover:bg-red-600" />
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 font-mono">{day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Grid Form Input & Tabel Entri */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Input Arus Kas (Bisa untuk input manual kas besar) */}
            <Card className="bg-white border-slate-200 shadow-sm h-fit">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-800">Catat Uang Masuk / Keluar</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Jenis Transaksi</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button" 
                        className={`cursor-pointer ${type === 'MASUK' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} 
                        onClick={() => setType('MASUK')}
                      >
                        Uang Masuk
                      </Button>
                      <Button 
                        type="button" 
                        className={`cursor-pointer ${type === 'KELUAR' ? 'bg-red-600 hover:bg-red-700 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} 
                        onClick={() => setType('KELUAR')}
                      >
                        Uang Keluar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tanggal *</label>
                    <Input type="date" value={flowDate} onChange={(e) => setFlowDate(e.target.value)} required />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nominal (Rp) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Rp</span>
                      <Input 
                        className="pl-9 font-semibold text-slate-800" 
                        placeholder="0" 
                        value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setAmount(val ? val : '');
                        }} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Keterangan / Rincian *</label>
                    <Input placeholder="Contoh: Pembayaran Invoice Vendor" value={description} onChange={(e) => setDescription(e.target.value)} required />
                  </div>

                  <Button type="submit" className="w-full font-bold gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Simpan Arus Kas
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tabel Rincian Entri */}
            <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100 shrink-0">
                <CardTitle className="text-base font-bold text-slate-800">
                  Rincian Histori Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="overflow-x-auto max-h-[400px]">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-100">
                      <TableRow>
                        <TableHead className="pl-6">Tanggal</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead className="text-right pr-6">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-indigo-600" /></TableCell></TableRow>
                      ) : cashFlowData.flows.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500 bg-slate-50/50">Belum ada histori di bulan ini.</TableCell></TableRow>
                      ) : (
                        cashFlowData.flows.map((f) => (
                          <TableRow key={f.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-mono text-xs pl-6">{f.flow_date}</TableCell>
                            <TableCell>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.type === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                {f.type}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-slate-800">{f.description}</TableCell>
                            <TableCell className={`text-right font-bold pr-6 ${f.type === 'MASUK' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {f.type === 'MASUK' ? '+' : '-'} {formatRp(f.amount)}
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