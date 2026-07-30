import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, TrendingUp, Wallet, ShoppingBag, LogOut, Menu, X, 
  RefreshCw, Loader2, Download, Award, UserPlus 
} from 'lucide-react';

export default function DataMitraManajer() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [customerData, setCustomerData] = useState({ mitraList: [], nonMitraList: [], totalCustomers: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat database pelanggan");
    return result.data;
  };

  useEffect(() => {
    fetchCustomers()
      .then(setCustomerData)
      .catch(err => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchCustomers()
      .then(setCustomerData)
      .catch(err => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  // Unduh CSV Mitra / Non-Mitra
  const exportToSpreadsheet = (typeList, filename) => {
    if (!typeList || typeList.length === 0) {
      return toast.warning("Tidak ada data untuk diunduh");
    }

    const headers = ['Nama UMKM', 'Kontak Telepon/WA', 'Total Kali Order', 'Total Nilai Belanja (Rp)', 'Tanggal Order Terakhir', 'Status Mitra'];
    const rows = typeList.map(c => [
      `"${(c.umkm_name || '').replace(/"/g, '""')}"`,
      `'${c.phone || ''}`,
      c.total_orders,
      c.total_spend,
      new Date(c.last_order_date).toLocaleDateString('id-ID'),
      c.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Database berhasil diunduh ke Excel/Sheets!");
  };

  const formatRp = (val) => `Rp ${parseInt(val || 0).toLocaleString('id-ID')}`;

  return (
    <div className="h-screen flex bg-slate-100 font-sans text-slate-800 relative overflow-hidden">
      
      {/* Backdrop Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Manajer */}
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
          <button onClick={() => { setIsSidebarOpen(false); navigate('/manajer'); }} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 hover:text-white rounded-lg font-medium text-sm transition-colors cursor-pointer">
            <TrendingUp size={18} /> Executive Dashboard
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/manajer/keuangan'); }} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 hover:text-white rounded-lg font-medium text-sm transition-colors cursor-pointer">
            <Wallet size={18} /> Laporan Arus Kas
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/manajer/pembelian'); }} className="w-full flex items-center gap-3 px-3.5 py-3 text-indigo-200 hover:bg-indigo-900/60 hover:text-white rounded-lg font-medium text-sm transition-colors cursor-pointer">
            <ShoppingBag size={18} /> Laporan Transaksi
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/manajer/mitra'); }} className="w-full flex items-center gap-3 px-3.5 py-3 bg-indigo-800/80 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer border border-indigo-700">
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
        
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-600 hover:bg-slate-100 cursor-pointer">
              <Menu size={22} />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Database Mitra & Pelanggan UMKM</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer bg-white">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase">Total UMKM Terdata</CardTitle>
                <Users className="text-indigo-600" size={18} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-800">{customerData.totalCustomers} <span className="text-xs font-normal text-slate-500">Pelanggan</span></div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-200 shadow-sm">
              <CardHeader className="pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-emerald-700 uppercase">Mitra Terdaftar (Loyal)</CardTitle>
                <Award className="text-emerald-600" size={18} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-800">{customerData.mitraList.length} <span className="text-xs font-normal text-slate-500">UMKM</span></div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50/50 border-amber-200 shadow-sm">
              <CardHeader className="pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-amber-700 uppercase">Pembeli Non-Mitra</CardTitle>
                <UserPlus className="text-amber-600" size={18} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-amber-800">{customerData.nonMitraList.length} <span className="text-xs font-normal text-slate-500">UMKM Baru</span></div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="mitra" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <TabsList className="bg-white border border-slate-200 p-1">
                <TabsTrigger value="mitra" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs cursor-pointer">
                  🏆 Mitra Terdaftar ({customerData.mitraList.length})
                </TabsTrigger>
                <TabsTrigger value="nonmitra" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white font-bold text-xs cursor-pointer">
                  👤 Pembeli Non-Mitra ({customerData.nonMitraList.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: MITRA TERDAFTAR */}
            <TabsContent value="mitra">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">Daftar Mitra Terdaftar</CardTitle>
                    <CardDescription className="text-xs">UMKM yang telah melakukan pemesanan berulang (Repeat Order).</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => exportToSpreadsheet(customerData.mitraList, 'Data_Mitra_Terdaftar_SIMKEMAS')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs cursor-pointer">
                    <Download size={14} /> Unduh Mitra (.csv)
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="pl-6 py-3">Nama UMKM</TableHead>
                          <TableHead>Kontak WA/Telp</TableHead>
                          <TableHead>Total Frekuensi Order</TableHead>
                          <TableHead>Total Akumulasi Belanja</TableHead>
                          <TableHead className="text-right pr-6">Order Terakhir</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-indigo-600" /></TableCell></TableRow>
                        ) : customerData.mitraList.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">Belum ada mitra terdaftar.</TableCell></TableRow>
                        ) : (
                          customerData.mitraList.map((c, i) => (
                            <TableRow key={i} className="hover:bg-slate-50">
                              <TableCell className="pl-6 font-bold text-slate-800">{c.umkm_name}</TableCell>
                              <TableCell className="font-mono text-xs text-slate-600">{c.phone}</TableCell>
                              <TableCell><Badge className="bg-emerald-100 text-emerald-800">{c.total_orders} Kali Order</Badge></TableCell>
                              <TableCell className="font-bold text-emerald-700">{formatRp(c.total_spend)}</TableCell>
                              <TableCell className="text-right pr-6 text-xs text-slate-500">{new Date(c.last_order_date).toLocaleDateString('id-ID')}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: PEMBELI NON-MITRA */}
            <TabsContent value="nonmitra">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">Daftar Pembeli Non-Mitra</CardTitle>
                    <CardDescription className="text-xs">Pelanggan baru / transaksi pertama yang belum menjadi mitra langganan.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => exportToSpreadsheet(customerData.nonMitraList, 'Data_Pembeli_Non_Mitra_SIMKEMAS')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs cursor-pointer">
                    <Download size={14} /> Unduh Non-Mitra (.csv)
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="pl-6 py-3">Nama UMKM</TableHead>
                          <TableHead>Kontak WA/Telp</TableHead>
                          <TableHead>Total Order</TableHead>
                          <TableHead>Total Belanja</TableHead>
                          <TableHead className="text-right pr-6">Order Terakhir</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-indigo-600" /></TableCell></TableRow>
                        ) : customerData.nonMitraList.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">Belum ada pembeli non-mitra.</TableCell></TableRow>
                        ) : (
                          customerData.nonMitraList.map((c, i) => (
                            <TableRow key={i} className="hover:bg-slate-50">
                              <TableCell className="pl-6 font-bold text-slate-800">{c.umkm_name}</TableCell>
                              <TableCell className="font-mono text-xs text-slate-600">{c.phone}</TableCell>
                              <TableCell><Badge variant="outline" className="bg-slate-100 text-slate-700">{c.total_orders} Order</Badge></TableCell>
                              <TableCell className="font-bold text-slate-700">{formatRp(c.total_spend)}</TableCell>
                              <TableCell className="text-right pr-6 text-xs text-slate-500">{new Date(c.last_order_date).toLocaleDateString('id-ID')}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

        </main>
      </div>
    </div>
  );
}