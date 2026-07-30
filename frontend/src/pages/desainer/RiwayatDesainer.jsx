import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, ArrowLeft, RefreshCw, Loader2, Search, ExternalLink } from 'lucide-react';

export default function RiwayatDesainer() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    const res = await fetch('/api/work-orders?history=true');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat riwayat desain");
    return result.data.workOrders;
  };

  useEffect(() => {
    fetchHistory()
      .then(setHistoryList)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchHistory()
      .then(setHistoryList)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  const filteredHistory = historyList.filter(wo =>
    wo.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.umkm_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-slate-900 p-4 sm:p-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <History className="text-purple-400" /> Riwayat Desain Diteruskan
            </h1>
            <p className="text-slate-400 text-sm">Daftar Surat Perintah Kerja yang sudah selesai didesain dan dikirim ke divisi selanjutnya.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/desainer')} className="border-white/20 text-slate-200 hover:bg-white/10 gap-2">
              <ArrowLeft size={16} /> Kembali ke Studio
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="border-white/20 text-slate-200 hover:bg-white/10">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/80 border-white/10 backdrop-blur-xl shadow-xl text-slate-100">
          <CardHeader className="pb-3 border-b border-white/10 flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="text-base font-bold text-white">Arsip Pekerjaan Selesai</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Cari Invoice / UMKM..." 
                className="pl-9 bg-black/30 border-white/10 text-xs text-white placeholder:text-slate-500" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5 border-b border-white/10">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-300">Invoice & UMKM</TableHead>
                    <TableHead className="text-slate-300">Rincian Kemasan</TableHead>
                    <TableHead className="text-slate-300">Posisi SPK Saat Ini</TableHead>
                    <TableHead className="text-slate-300">Tanggal Selesai Desain</TableHead>
                    <TableHead className="text-right text-slate-300">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow className="border-white/10"><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-purple-400" /></TableCell></TableRow>
                  ) : filteredHistory.length === 0 ? (
                    <TableRow className="border-white/10"><TableCell colSpan={5} className="text-center py-10 text-slate-400">Belum ada riwayat pekerjaan desain yang dikirim.</TableCell></TableRow>
                  ) : (
                    filteredHistory.map((wo) => (
                      <TableRow key={wo.id} className="border-white/10 hover:bg-white/5">
                        <TableCell>
                          <div className="font-bold text-white">{wo.umkm_name}</div>
                          <div className="font-mono text-xs text-purple-300">{wo.invoice_no}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {wo.items?.map((item) => (
                              <div key={item.id} className="text-xs text-slate-300">
                                • {item.nama_kemasan} ({item.jenis_kemasan}) - <b>{item.qty} Pcs</b>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-950/60 text-blue-300 border-blue-800">
                            {wo.current_stage} ({wo.status})
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono">
                          {new Date(wo.updated_at).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-purple-300 hover:text-white hover:bg-white/10 text-xs gap-1"
                            onClick={() => window.open(`/kasir/spk/${wo.invoice_no}`, '_blank')}
                          >
                            <ExternalLink size={14} /> Lihat SPK
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

    </div>
  );
}