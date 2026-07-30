import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, TrendingUp, Wallet, Users, LogOut, Menu, X, 
  RefreshCw, Download, Calendar, ExternalLink 
} from 'lucide-react';

export default function LaporanPembelianManajer() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString());

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bungkus dengan useCallback agar bebas dari warning ESLint
  const fetchTransactions = useCallback(async () => {
    const res = await fetch('/api/transactions?history=true');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat transaksi");
    return result.data.transactions || result.data;
  }, []);

  useEffect(() => {
    fetchTransactions()
      .then(setTransactions)
      .catch(err => {
        console.error(err);
        toast.error(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [fetchTransactions]);

  // Ini dia fungsi yang hilang tadi!
  const handleRefresh = () => {
    setIsLoading(true);
    fetchTransactions()
      .then(setTransactions)
      .catch(err => {
        console.error(err);
        toast.error(err.message);
      })
      .finally(() => setIsLoading(false));
  };

  const filteredData = useMemo(() => {
    const monthNum = parseInt(selectedMonth) - 1;
    const yearNum = parseInt(selectedYear);
    return transactions.filter(t => {
      const d = new Date(t.created_at || t.order_date || new Date());
      return d.getMonth() === monthNum && d.getFullYear() === yearNum;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Kalkulasi Chart Penjualan Harian
  const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
  const daysArray = Array.from({ length: lastDay }, (_, i) => i + 1);
  
  const dailySales = useMemo(() => {
    const stats = {};
    filteredData.forEach(t => {
      const day = new Date(t.created_at || t.order_date).getDate();
      stats[day] = (stats[day] || 0) + (t.total_amount || 0);
    });
    return stats;
  }, [filteredData]);
  
  const maxSales = Math.max(...Object.values(dailySales), 100000);

  const exportToSpreadsheet = () => {
    if (filteredData.length === 0) return toast.warning("Tidak ada data untuk diunduh");

    const headersStats = ['Tanggal', 'Total Nilai Penjualan (Rp)'];
    const rowsStats = daysArray.map(day => [`${selectedYear}-${selectedMonth.padStart(2,'0')}-${String(day).padStart(2,'0')}`, dailySales[day] || 0]);

    const headers = ['\nInvoice No', 'UMKM Name', 'Deadline', 'Total Amount', 'DP Amount', 'Status Bayar'];
    const rows = filteredData.map(t => [
      t.invoice_no, 
      `"${(t.umkm_name || '').replace(/"/g, '""')}"`, 
      t.deadline, 
      t.total_amount, 
      t.dp_amount || 0, 
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + "TREN PENJUALAN HARIAN (SIAP CHART)\n" 
      + [headersStats.join(','), ...rowsStats.map(e => e.join(','))].join('\n')
      + "\n\nRINCIAN TRANSAKSI\n" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Pembelian_${selectedYear}_Bulan_${selectedMonth}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Laporan Transaksi berhasil diunduh!");
  };

  const formatRp = (val) => `Rp ${parseInt(val || 0).toLocaleString('id-ID')}`;
  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const totalOmzet = useMemo(() => filteredData.reduce((a, b) => a + (b.total_amount || 0), 0), [filteredData]);

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
          <button onClick={() => navigate('/manajer/keuangan')} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 rounded-lg text-sm cursor-pointer"><Wallet size={18} /> Laporan Arus Kas</button>
          <button onClick={() => navigate('/manajer/pembelian')} className="w-full flex items-center gap-3 px-3.5 py-3 bg-indigo-800/80 text-white rounded-lg font-bold text-sm border border-indigo-700 cursor-pointer"><ShoppingBag size={18} /> Laporan Transaksi</button>
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
            <h1 className="text-lg font-bold">Laporan Pembelian</h1>
          </div>
          <Button onClick={exportToSpreadsheet} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer text-xs sm:text-sm"><Download size={16} className="mr-2" /> Unduh Laporan</Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2">
              <CardContent className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Calendar size={18} className="text-indigo-600" /> Filter:</div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-36 bg-slate-50"><SelectValue/></SelectTrigger>
                    <SelectContent>{namaBulan.map((b, i)=><SelectItem key={i} value={String(i+1)}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-28 bg-slate-50"><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="2025">2025</SelectItem><SelectItem value="2026">2026</SelectItem></SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={handleRefresh} className="cursor-pointer shrink-0"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/></Button>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-indigo-900 text-white border-indigo-800 shadow-sm"><CardContent className="pt-4 flex justify-between"><div><span className="text-xs font-bold text-indigo-300">TOTAL OMZET TEREKAP</span><span className="block text-2xl font-black">{formatRp(totalOmzet)}</span></div><Badge className="bg-indigo-700">{filteredData.length} Order</Badge></CardContent></Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base font-bold text-slate-800">Tren Penjualan Harian</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="h-40 flex items-end gap-1 overflow-x-auto border-b border-slate-200 pb-2 px-1">
                {daysArray.map((day) => {
                  const val = dailySales[day] || 0;
                  const h = Math.round((val / maxSales) * 100);
                  return (
                    <div key={day} className="flex-1 min-w-[15px] flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded whitespace-nowrap z-20">
                        <b>Tgl {day}</b><span className="text-indigo-400">Omzet: {formatRp(val)}</span>
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full bg-indigo-400 rounded-t hover:bg-indigo-600 transition-all" />
                      <span className="text-[9px] text-slate-400 mt-1">{day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100"><CardTitle className="text-base font-bold text-slate-800">Daftar Pembelian</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50"><TableRow><TableHead className="pl-6 py-4">Invoice</TableHead><TableHead>UMKM</TableHead><TableHead>Tagihan</TableHead><TableHead>Status Bayar</TableHead><TableHead>Progres</TableHead><TableHead className="text-right pr-6">Aksi</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredData.map(t => (
                      <TableRow key={t.id} className="hover:bg-slate-50"><TableCell className="pl-6 font-mono text-xs">{t.invoice_no}</TableCell><TableCell className="text-sm font-bold">{t.umkm_name}</TableCell><TableCell className="font-bold text-sm">{formatRp(t.total_amount)}</TableCell><TableCell><Badge variant="outline" className={t.status === 'Lunas' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>{t.status}</Badge></TableCell><TableCell><Badge variant="outline" className="bg-slate-100 text-slate-700">{t.current_stage}</Badge></TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50 cursor-pointer" onClick={() => window.open(`/manajer/spk/${t.invoice_no}`, '_blank')}><ExternalLink size={14} className="mr-1"/> SPK</Button></TableCell></TableRow>
                    ))}
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