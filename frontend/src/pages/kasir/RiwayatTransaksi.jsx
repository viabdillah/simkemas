import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, ClipboardList, Search, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';

export default function RiwayatTransaksi() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    // Tarik semua data dari awal sampai akhir
    const res = await fetch('/api/transactions?history=true');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat riwayat transaksi");
    return result.data.transactions || result.data;
  };

  useEffect(() => {
    fetchTransactions()
      .then(setTransactions)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchTransactions()
      .then(setTransactions)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  // Filter murni hanya untuk Search Box
  const filteredData = useMemo(() => {
    let result = [...transactions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        (t.invoice_no || '').toLowerCase().includes(q) ||
        (t.umkm_name || '').toLowerCase().includes(q) ||
        (t.phone || '').includes(q)
      );
    }
    // Urutkan dari yang paling baru
    return result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [transactions, searchQuery]);

  const formatRp = (angka) => `Rp ${parseInt(angka || 0).toLocaleString('id-ID')}`;

  const getProgressBadge = (stage) => {
    switch (stage) {
      case 'Selesai': return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-0">✅ Selesai (Diambil)</Badge>;
      case 'Kasir': return <Badge className="bg-teal-500 hover:bg-teal-600 text-white shadow-sm border-0">🛍️ Siap Diambil</Badge>;
      case 'Operator Packaging': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-0">📦 Proses Packaging</Badge>;
      case 'Operator Mesin': return <Badge className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm border-0">⚙️ Proses Cetak</Badge>;
      case 'Desainer': return <Badge className="bg-purple-500 hover:bg-purple-600 text-white shadow-sm border-0">🎨 Proses Desain</Badge>;
      default: return <Badge className="bg-slate-500 hover:bg-slate-600 text-white shadow-sm border-0">⏳ Menunggu Antrean</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-primary" /> Arsip Seluruh Transaksi
          </h1>
          <p className="text-slate-500 text-sm">Cari riwayat invoice dan Surat Perintah Kerja (SPK) lama di sini.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/kasir')} className="gap-2 bg-white">
            <ArrowLeft size={16} /> Kembali ke POS
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="bg-white">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-base font-bold text-slate-800">Daftar Dokumen Transaksi</CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Cari No. Invoice / Nama UMKM..."
              className="pl-9 bg-slate-50 text-xs h-10 focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="pl-6 py-4">Tgl / No. Invoice</TableHead>
                  <TableHead>UMKM / Kontak</TableHead>
                  <TableHead>Total Tagihan</TableHead>
                  <TableHead>Status Bayar</TableHead>
                  <TableHead>Progres Pabrik</TableHead>
                  <TableHead className="text-right pr-6">Aksi Dokumen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Belum ada riwayat transaksi ditemukan.</TableCell></TableRow>
                ) : (
                  filteredData.map((t) => (
                    <TableRow key={t.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6">
                        <div className="text-xs text-slate-500 mb-0.5">
                          {new Date(t.created_at || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="font-mono font-bold text-slate-800">{t.invoice_no}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-800">{t.umkm_name}</div>
                        <div className="text-xs text-slate-500">{t.phone}</div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">{formatRp(t.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={t.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{getProgressBadge(t.current_stage)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50 border-blue-200" onClick={() => window.open(`/kasir/invoice/${t.invoice_no}`, '_blank')}>
                            <FileText size={14} className="mr-1" /> Invoice
                          </Button>
                          <Button size="sm" variant="outline" className="text-amber-600 hover:bg-amber-50 border-amber-200" onClick={() => window.open(`/kasir/spk/${t.invoice_no}`, '_blank')}>
                            <ClipboardList size={14} className="mr-1" /> SPK
                          </Button>
                        </div>
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
  );
}