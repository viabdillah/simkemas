import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import KasirSidebar from '@/layouts/KasirSidebar';
import { 
  FileText, ClipboardList, Search, RefreshCw, Loader2, 
  Menu, LogOut, ShoppingCart, History 
} from 'lucide-react';

export default function RiwayatTransaksi() {
  const { logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Default true saat komponen pertama kali dimuat
  const [searchQuery, setSearchQuery] = useState('');

  // 1. FUNGSI API MURNI
  const fetchTransactionsAPI = async () => {
    const res = await fetch('/api/transactions?history=true');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat riwayat transaksi");
    return result.data.transactions || result.data;
  };

  // 2. INITIAL LOAD (Bebas Linter & Aman dari Memory Leak)
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const data = await fetchTransactionsAPI();
        if (isMounted) setTransactions(data);
      } catch (err) {
        if (isMounted) toast.error(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialData();

    return () => { 
      isMounted = false; 
    };
  }, []); // Array dependency kosong yang benar dan aman

  // 3. MANUAL REFRESH BUTTON HANDLER
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

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.invoice_no || '').toLowerCase().includes(q) ||
        (t.umkm_name || '').toLowerCase().includes(q) ||
        (t.phone || '').includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [transactions, searchQuery]);

  const formatRp = (angka) => `Rp ${(parseInt(angka) || 0).toLocaleString('id-ID')}`;

  const getProgressBadge = (stage) => {
    if (stage === 'Selesai') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">✅ Selesai</Badge>;
    if (stage === 'Kasir') return <Badge className="bg-teal-50 text-teal-700 border-teal-200 shadow-sm">🛍️ Siap Diambil</Badge>;
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-sm">⏳ {stage || 'Proses Pabrik'}</Badge>;
  };

  return (
    <div className="h-[100dvh] bg-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* SIDEBAR COMPONENT (OFF-CANVAS) */}
      <KasirSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* HEADER UTAMA */}
      <header className="bg-white h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)} 
            className="text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <Menu size={22} />
          </Button>
          <div className="flex items-center gap-2.5 text-primary font-bold text-lg tracking-tight">
            <ShoppingCart size={22} /> SIMKEMAS POS
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            💻 Mode Kasir Fokus
          </span>
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 hover:bg-red-50 font-bold gap-1.5 cursor-pointer px-2 sm:px-3">
            <LogOut size={16} />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      {/* AREA UTAMA WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-[1700px] mx-auto w-full flex flex-col gap-6">
        
        {/* CARD HEADER (Terpadu) */}
        <Card className="border-slate-200 shadow-sm shrink-0 bg-white">
          <CardContent className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <History className="text-blue-600" /> Riwayat Transaksi
              </h1>
              <p className="text-sm text-slate-500 mt-1">Pantau seluruh riwayat pesanan dan cetak ulang dokumen.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="Cari Invoice / Nama UMKM..." 
                  className="pl-9 bg-slate-50 w-full border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer w-full sm:w-auto">
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AREA TABEL */}
        <Card className="bg-white border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-100">
                <TableRow>
                  <TableHead className="pl-6 py-4">Tgl & Invoice</TableHead>
                  <TableHead>UMKM / Telepon</TableHead>
                  <TableHead>Total Tagihan</TableHead>
                  <TableHead>Status Pembayaran</TableHead>
                  <TableHead>Progres</TableHead>
                  <TableHead className="text-right pr-6">Cetak Dokumen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary h-8 w-8" /></TableCell></TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500 bg-slate-50/50">Tidak ada riwayat transaksi ditemukan.</TableCell></TableRow>
                ) : (
                  filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="text-xs text-slate-500 mb-0.5">
                          {new Date(t.created_at || new Date()).toLocaleDateString('id-ID')}
                        </div>
                        <div className="font-mono font-bold text-slate-800">{t.invoice_no}</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-bold text-slate-800">{t.umkm_name}</div>
                        <div className="text-xs text-slate-500">{t.phone}</div>
                      </TableCell>
                      
                      <TableCell className="font-bold text-slate-800">{formatRp(t.total_amount)}</TableCell>
                      
                      <TableCell>
                        <Badge className={`border-0 ${t.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>{getProgressBadge(t.current_stage)}</TableCell>
                      
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50 border-blue-200 cursor-pointer shadow-sm" onClick={() => window.open(`/kasir/invoice/${t.invoice_no}`, '_blank')}>
                            <FileText size={14} className="mr-1.5" /> Invoice
                          </Button>
                          <Button size="sm" variant="outline" className="text-amber-600 hover:bg-amber-50 border-amber-200 cursor-pointer shadow-sm" onClick={() => window.open(`/kasir/spk/${t.invoice_no}`, '_blank')}>
                            <ClipboardList size={14} className="mr-1.5" /> SPK
                          </Button>
                        </div>
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
  );
}