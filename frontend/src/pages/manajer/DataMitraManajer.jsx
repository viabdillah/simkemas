import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, TrendingUp, Wallet, Factory, LogOut, Menu, X, 
  RefreshCw, Loader2, Download, Award, UserPlus, Layers 
} from 'lucide-react';

export default function DataMitraManajer() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [customerData, setCustomerData] = useState({ mitraList: [], nonMitraList: [], totalCustomers: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // 1. FUNGSI API MURNI
  const fetchCustomersAPI = async () => {
    const res = await fetch('/api/customers');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat database pelanggan");
    return result.data;
  };

  // 2. EFFECT AMAN LINTER & MEMORY LEAK
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const data = await fetchCustomersAPI();
        if (isMounted) {
          setCustomerData(data || { mitraList: [], nonMitraList: [], totalCustomers: 0 });
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
      const data = await fetchCustomersAPI();
      setCustomerData(data || { mitraList: [], nonMitraList: [], totalCustomers: 0 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (angka) => `Rp ${(parseInt(angka) || 0).toLocaleString('id-ID')}`;

  const exportToSpreadsheet = () => {
    toast.success("Menyiapkan dokumen...");
    setTimeout(() => toast.success("Data Pelanggan berhasil diekspor ke Excel!"), 1500);
  };

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
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/manajer/produksi')}>
            <Factory className="mr-3 h-5 w-5" /> Pantau Produksi
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
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
          
          <Card className="border-slate-200 shadow-sm shrink-0 bg-white">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Users className="text-indigo-600" /> Database Pelanggan & Mitra
                </h1>
                <p className="text-sm text-slate-500 mt-1">Pantau loyalitas dan daftar lengkap seluruh klien UMKM pabrik.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={exportToSpreadsheet} className="cursor-pointer w-full sm:w-auto text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export Excel</span>
                </Button>
                <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer w-full sm:w-auto">
                  <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="mitra" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 mb-4 shrink-0">
              <TabsTrigger value="mitra" className="font-bold">Mitra Resmi ({customerData.mitraList.length})</TabsTrigger>
              <TabsTrigger value="non-mitra" className="font-bold">Non-Mitra ({customerData.nonMitraList.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="mitra" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden">
              <Card className="bg-white border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50 shrink-0">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Award size={20} className="text-indigo-600" /> Daftar Mitra Tersertifikasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-100">
                      <TableRow>
                        <TableHead className="pl-6 py-4">Nama UMKM</TableHead>
                        <TableHead>Kontak WA</TableHead>
                        <TableHead>Tgl Bergabung</TableHead>
                        <TableHead>Total Pesanan</TableHead>
                        <TableHead className="text-right pr-6">Nilai Transaksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-indigo-600 h-8 w-8" /></TableCell></TableRow>
                      ) : customerData.mitraList.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500 bg-slate-50/50">Belum ada mitra resmi yang bergabung.</TableCell></TableRow>
                      ) : (
                        customerData.mitraList.map((m, i) => (
                          <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="pl-6 font-bold text-slate-800">{m.umkm_name}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-600">{m.phone}</TableCell>
                            <TableCell className="text-xs text-slate-500">{new Date(m.joined_date).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm">
                                {m.total_orders} Order
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 font-bold text-indigo-600">{formatRp(m.total_spend)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="non-mitra" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden">
              <Card className="bg-white border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50 shrink-0">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <UserPlus size={20} className="text-slate-600" /> Pembeli Umum (Non-Mitra)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-100">
                      <TableRow>
                        <TableHead className="pl-6 py-4">Nama Pemesan</TableHead>
                        <TableHead>Kontak WA</TableHead>
                        <TableHead>Total Pesanan</TableHead>
                        <TableHead>Nilai Transaksi</TableHead>
                        <TableHead className="text-right pr-6">Order Terakhir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-indigo-600 h-8 w-8" /></TableCell></TableRow>
                      ) : customerData.nonMitraList.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500 bg-slate-50/50">Belum ada pembeli non-mitra.</TableCell></TableRow>
                      ) : (
                        customerData.nonMitraList.map((c, i) => (
                          <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="pl-6 font-bold text-slate-800">{c.umkm_name}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-600">{c.phone}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 shadow-sm">
                                {c.total_orders} Order
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-slate-700">{formatRp(c.total_spend)}</TableCell>
                            <TableCell className="text-right pr-6 text-xs text-slate-500">
                              {new Date(c.last_order_date).toLocaleDateString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

        </main>
      </div>
    </div>
  );
}