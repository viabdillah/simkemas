import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wallet, TrendingUp, ShoppingBag, Users, LogOut, Menu, X, 
  RefreshCw, Loader2, Download, ArrowUpRight, ArrowDownRight, Calendar, Plus 
} from 'lucide-react';

export default function LaporanKeuanganManajer() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString());

  const [cashFlowData, setCashFlowData] = useState({ flows: [], dailyStats: [], lastDay: 31 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState('MASUK');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [flowDate, setFlowDate] = useState(today.toISOString().split('T')[0]);

  // FIX LINTER 2: Bungkus fetch dengan useCallback agar aman dimasukkan ke dependency array useEffect
  const fetchCashFlow = useCallback(async () => {
    const res = await fetch(`/api/cash-flow?year=${selectedYear}&month=${selectedMonth}`);
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat laporan keuangan");
    return result.data;
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchCashFlow()
      .then(setCashFlowData)
      .catch(err => {
        console.error(err);
        toast.error(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [fetchCashFlow]); // Dependency array kini mematuhi aturan React

  const handleRefresh = () => {
    setIsLoading(true);
    fetchCashFlow()
      .then(setCashFlowData)
      .catch(err => {
        console.error(err);
        toast.error(err.message);
      })
      .finally(() => setIsLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description || !flowDate) return toast.warning("Mohon lengkapi nominal, keterangan, dan tanggal");
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cash-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: parseInt(amount), description, flow_date: flowDate })
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
      console.error(err); // FIX LINTER 1: Panggil err dengan console.error
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToSpreadsheet = () => {
    if (!cashFlowData.flows || cashFlowData.flows.length === 0) return toast.warning("Tidak ada data arus kas untuk diunduh");
    
    const headersStats = ['Tanggal', 'Total Pemasukan', 'Total Pengeluaran'];
    const rowsStats = cashFlowData.dailyStats.map(d => [d.flow_date, d.total_masuk, d.total_keluar]);
    
    const headersDetail = ['\nID Transaksi', 'Tanggal', 'Jenis', 'Keterangan', 'Nominal (Rp)'];
    const rowsDetail = cashFlowData.flows.map(f => [f.id, f.flow_date, f.type, `"${(f.description || '').replace(/"/g, '""')}"`, f.amount]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + "RINGKASAN HARIAN (SIAP CHART)\n" 
      + [headersStats.join(','), ...rowsStats.map(e => e.join(','))].join('\n')
      + "\n\nRINCIAN TRANSAKSI\n" 
      + [headersDetail.join(','), ...rowsDetail.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_${selectedYear}_Bulan_${selectedMonth}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Laporan berhasil diunduh!");
  };

  const formatRp = (val) => `Rp ${parseInt(val || 0).toLocaleString('id-ID')}`;
  const totalMasuk = useMemo(() => cashFlowData.flows.filter(f => f.type === 'MASUK').reduce((a, b) => a + b.amount, 0), [cashFlowData]);
  const totalKeluar = useMemo(() => cashFlowData.flows.filter(f => f.type === 'KELUAR').reduce((a, b) => a + b.amount, 0), [cashFlowData]);
  const saldoNetto = totalMasuk - totalKeluar;
  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const daysArray = Array.from({ length: cashFlowData.lastDay }, (_, i) => i + 1);
  const maxDailyVal = Math.max(...cashFlowData.dailyStats.map(d => Math.max(d.total_masuk, d.total_keluar)), 10000);

  return (
    <div className="h-screen flex bg-slate-100 font-sans text-slate-800 relative overflow-hidden">
      
      {isSidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`absolute lg:static inset-y-0 left-0 z-50 w-64 bg-indigo-950 text-white flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-indigo-900/80">
          <div className="flex items-center gap-2"><TrendingUp className="text-indigo-400" size={22} /><span className="font-extrabold text-lg">SIMKEMAS Exec</span></div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-indigo-300 hover:text-white"><X size={20} /></Button>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          <button onClick={() => navigate('/manajer')} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 rounded-lg text-sm cursor-pointer"><TrendingUp size={18} /> Executive Dashboard</button>
          <button onClick={() => navigate('/manajer/keuangan')} className="w-full flex items-center gap-3 px-3.5 py-3 bg-indigo-800/80 text-white rounded-lg font-bold text-sm border border-indigo-700 cursor-pointer"><Wallet size={18} /> Laporan Arus Kas</button>
          <button onClick={() => navigate('/manajer/pembelian')} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 rounded-lg text-sm cursor-pointer"><ShoppingBag size={18} /> Laporan Transaksi</button>
          <button onClick={() => navigate('/manajer/mitra')} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 rounded-lg text-sm cursor-pointer"><Users size={18} /> Database Mitra UMKM</button>
        </nav>
        <div className="p-4 border-t border-indigo-900/80">
          <Button variant="outline" onClick={logout} className="w-full h-11 border-indigo-800 bg-indigo-900/40 text-red-300 hover:bg-red-950/60 cursor-pointer"><LogOut size={16} className="mr-2" /> Keluar</Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="lg:hidden cursor-pointer"><Menu size={22} /></Button>
            <h1 className="text-lg font-bold text-slate-800">Laporan Keuangan & Arus Kas</h1>
          </div>
          <Button onClick={exportToSpreadsheet} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer text-xs sm:text-sm"><Download size={16} className="mr-2"/> Unduh Laporan</Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Calendar size={18} className="text-indigo-600" /> Filter Periode:</div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Select value={selectedMonth} onValueChange={(val) => { setIsLoading(true); setSelectedMonth(val); }}>
                  <SelectTrigger className="w-36 bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>{namaBulan.map((b, idx) => <SelectItem key={idx + 1} value={(idx + 1).toString()}>{b}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={(val) => { setIsLoading(true); setSelectedYear(val); }}>
                  <SelectTrigger className="w-28 bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="2025">2025</SelectItem><SelectItem value="2026">2026</SelectItem><SelectItem value="2027">2027</SelectItem></SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/></Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-emerald-50/50 border-emerald-200"><CardContent className="pt-4 flex justify-between"><div><span className="text-xs font-bold text-emerald-700">PEMASUKAN</span><span className="block text-2xl font-black text-emerald-800">{formatRp(totalMasuk)}</span></div><div className="p-3 bg-emerald-100 text-emerald-700 rounded-full"><ArrowUpRight size={24}/></div></CardContent></Card>
            <Card className="bg-red-50/50 border-red-200"><CardContent className="pt-4 flex justify-between"><div><span className="text-xs font-bold text-red-700">PENGELUARAN</span><span className="block text-2xl font-black text-red-800">{formatRp(totalKeluar)}</span></div><div className="p-3 bg-red-100 text-red-700 rounded-full"><ArrowDownRight size={24}/></div></CardContent></Card>
            <Card className="bg-indigo-50/50 border-indigo-200"><CardContent className="pt-4 flex justify-between"><div><span className="text-xs font-bold text-indigo-700">SALDO NETTO</span><span className="block text-2xl font-black text-indigo-900">{formatRp(saldoNetto)}</span></div><div className="p-3 bg-indigo-100 text-indigo-700 rounded-full"><Wallet size={24}/></div></CardContent></Card>
          </div>

          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base font-bold text-slate-800">Grafik Arus Kas Harian</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="h-48 flex items-end gap-1 overflow-x-auto border-b pb-2 px-1">
                {daysArray.map((day) => {
                  const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const stat = cashFlowData.dailyStats.find(d => d.flow_date === dateStr) || { total_masuk: 0, total_keluar: 0 };
                  const hm = Math.round((stat.total_masuk / maxDailyVal) * 100);
                  const hk = Math.round((stat.total_keluar / maxDailyVal) * 100);
                  return (
                    <div key={day} className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-nowrap">
                        <b>Tgl {day}</b><span className="text-emerald-400">Masuk: {formatRp(stat.total_masuk)}</span><span className="text-red-400">Keluar: {formatRp(stat.total_keluar)}</span>
                      </div>
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div style={{ height: `${hm}%` }} className="w-1.5 bg-emerald-500 rounded-t hover:bg-emerald-600" />
                        <div style={{ height: `${hk}%` }} className="w-1.5 bg-red-500 rounded-t hover:bg-red-600" />
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1">{day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-3 border-b"><CardTitle className="text-base font-bold">Catat Arus Kas</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" className={`cursor-pointer ${type==='MASUK'?'bg-emerald-600 hover:bg-emerald-700 text-white':'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} onClick={()=>setType('MASUK')}>Masuk</Button>
                    <Button type="button" className={`cursor-pointer ${type==='KELUAR'?'bg-red-600 hover:bg-red-700 text-white':'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} onClick={()=>setType('KELUAR')}>Keluar</Button>
                  </div>
                  <div><label className="text-xs font-semibold">Tanggal</label><Input type="date" value={flowDate} onChange={(e)=>setFlowDate(e.target.value)} required /></div>
                  <div><label className="text-xs font-semibold">Nominal</label><Input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} required /></div>
                  <div><label className="text-xs font-semibold">Keterangan</label><Input value={description} onChange={(e)=>setDescription(e.target.value)} required /></div>
                  <Button type="submit" className="w-full font-bold cursor-pointer" disabled={isSubmitting}>{isSubmitting?<Loader2 className="animate-spin" size={16}/>:<Plus size={16}/>} Simpan</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white shadow-sm">
              <CardHeader className="pb-3 border-b"><CardTitle className="text-base font-bold">Rincian Transaksi</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[400px]">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0"><TableRow><TableHead>Tanggal</TableHead><TableHead>Jenis</TableHead><TableHead>Keterangan</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {cashFlowData.flows.map(f => (
                        <TableRow key={f.id}><TableCell className="text-xs">{f.flow_date}</TableCell><TableCell><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.type === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{f.type}</span></TableCell><TableCell className="text-sm">{f.description}</TableCell><TableCell className={`text-right font-bold ${f.type === 'MASUK' ? 'text-emerald-600' : 'text-red-600'}`}>{f.type === 'MASUK' ? '+' : '-'} {formatRp(f.amount)}</TableCell></TableRow>
                      ))}
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