import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, ArrowUpRight, ArrowDownRight, Plus, RefreshCw, Loader2, Calendar } from 'lucide-react';

export default function Keuangan() {
  const navigate = useNavigate();
  
  // State Filter Bulan & Tahun
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString());

  // State Data Arus Kas & Loading
  const [cashFlowData, setCashFlowData] = useState({ flows: [], dailyStats: [], lastDay: 31 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form Input Arus Kas
  const [type, setType] = useState('MASUK');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [flowDate, setFlowDate] = useState(today.toISOString().split('T')[0]);

  const fetchCashFlow = async () => {
    const res = await fetch(`/api/cash-flow?year=${selectedYear}&month=${selectedMonth}`);
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat data keuangan");
    return result.data;
  };

  useEffect(() => {
    fetchCashFlow()
      .then(setCashFlowData)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, [selectedYear, selectedMonth]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchCashFlow()
      .then(setCashFlowData)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
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
      console.error(err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRp = (val) => `Rp ${parseInt(val || 0).toLocaleString('id-ID')}`;

  // Kalkulasi Total Masuk, Keluar, dan Netto Bulan Ini
  const totalMasuk = cashFlowData.flows.filter(f => f.type === 'MASUK').reduce((acc, curr) => acc + curr.amount, 0);
  const totalKeluar = cashFlowData.flows.filter(f => f.type === 'KELUAR').reduce((acc, curr) => acc + curr.amount, 0);
  const saldoNetto = totalMasuk - totalKeluar;

  // Membangun array tanggal 1 sampai tanggal terakhir di bulan tsb untuk Chart
  const daysArray = Array.from({ length: cashFlowData.lastDay }, (_, i) => i + 1);
  const maxDailyVal = Math.max(...cashFlowData.dailyStats.map(d => Math.max(d.total_masuk, d.total_keluar)), 100000);

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen font-sans">
      
      {/* Header & Navigasi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-primary" /> Pencatatan Arus Kas & Analitik
          </h1>
          <p className="text-slate-500 text-sm">Kelola pemasukan, pengeluaran operasional, dan grafik bulanan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/kasir')} className="gap-2">
            <ArrowLeft size={16} /> Kembali ke POS
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bulan & Tahun */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Calendar size={18} className="text-primary" /> Filter Periode Laporan:
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={selectedMonth} onValueChange={(val) => { setIsLoading(true); setSelectedMonth(val); }}>
              <SelectTrigger className="w-36 bg-slate-50"><SelectValue placeholder="Bulan" /></SelectTrigger>
              <SelectContent>
                {namaBulan.map((b, idx) => (
                  <SelectItem key={idx + 1} value={(idx + 1).toString()}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={(val) => { setIsLoading(true); setSelectedYear(val); }}>
              <SelectTrigger className="w-28 bg-slate-50"><SelectValue placeholder="Tahun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
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
              <span className="text-xs font-bold text-red-700 block">TOTAL UANG KELUAR</span>
              <span className="text-2xl font-black text-red-800">{formatRp(totalKeluar)}</span>
            </div>
            <div className="p-3 bg-red-100 text-red-700 rounded-full"><ArrowDownRight size={24}/></div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-700 block">SALDO NETTO BULAN INI</span>
              <span className="text-2xl font-black text-blue-800">{formatRp(saldoNetto)}</span>
            </div>
            <div className="p-3 bg-blue-100 text-blue-700 rounded-full"><Wallet size={24}/></div>
          </CardContent>
        </Card>
      </div>

      {/* BAGAN / CHART ANALITIK HARIAN (Murni SVG & Tailwind - Bebas Error) */}
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
                  {/* Tooltip Hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-nowrap">
                    <b>Tgl {day}</b>
                    <span className="text-emerald-400">Masuk: {formatRp(stat.total_masuk)}</span>
                    <span className="text-red-400">Keluar: {formatRp(stat.total_keluar)}</span>
                  </div>

                  <div className="w-full flex items-end justify-center gap-0.5 h-full">
                    {/* Bar Hijau (Masuk) */}
                    <div 
                      style={{ height: `${heightMasuk}%` }} 
                      className="w-1.5 bg-emerald-500 rounded-t transition-all hover:bg-emerald-600" 
                    />
                    {/* Bar Merah (Keluar) */}
                    <div 
                      style={{ height: `${heightKeluar}%` }} 
                      className="w-1.5 bg-red-500 rounded-t transition-all hover:bg-red-600" 
                    />
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
        
        {/* Form Input Arus Kas */}
        <Card className="bg-white border-slate-200 shadow-sm">
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
                    className={type === 'MASUK' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold' : 'bg-slate-100 text-slate-700'} 
                    onClick={() => setType('MASUK')}
                  >
                    Uang Masuk
                  </Button>
                  <Button 
                    type="button" 
                    className={type === 'KELUAR' ? 'bg-red-600 hover:bg-red-700 text-white font-bold' : 'bg-slate-100 text-slate-700'} 
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
                <Input type="number" min="1" placeholder="Contoh: 150000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Keterangan *</label>
                <Input placeholder="Contoh: Beli lakban & plastik wrapping" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <Button type="submit" className="w-full font-bold gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Simpan Arus Kas
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tabel Rincian Entri */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">
              Rincian Transaksi ({namaBulan[parseInt(selectedMonth) - 1]} {selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px]">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : cashFlowData.flows.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">Belum ada transaksi di bulan ini.</TableCell></TableRow>
                  ) : (
                    cashFlowData.flows.map((f) => (
                      <TableRow key={f.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs">{f.flow_date}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.type === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {f.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{f.description}</TableCell>
                        <TableCell className={`text-right font-bold ${f.type === 'MASUK' ? 'text-emerald-600' : 'text-red-600'}`}>
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
    </div>
  );
}