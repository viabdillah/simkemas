import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  PackageCheck, Search, RefreshCw, ArrowLeft, Loader2, Calendar, 
  ChevronLeft, ChevronRight, CheckCircle2, DollarSign, Box
} from 'lucide-react';

export default function DaftarTunggu() {
  const navigate = useNavigate();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Modal Penyerahan & Pembayaran
  const [pickupModalData, setPickupModalData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form Inputs Modal
  const [pickupType, setPickupType] = useState('semua'); // 'semua' | 'sebagian'
  const [pickupNotes, setPickupNotes] = useState('');
  const [paymentOption, setPaymentOption] = useState('full'); // 'full' | 'custom' | 'none'
  const [customPayment, setCustomPayment] = useState('');

  const fetchWaitingList = async () => {
    const res = await fetch('/api/transactions?history=true');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error);
    return result.data.transactions || result.data;
  };

  useEffect(() => {
    fetchWaitingList()
      .then(setTransactions)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchWaitingList()
      .then(setTransactions)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  // Reset form saat modal dibuka
  const handleOpenPickupModal = (item) => {
    const sisa = (item.total_amount || 0) - (item.dp_amount || 0);
    setPickupModalData(item);
    setPickupType(item.pickup_status === 'Diambil Sebagian' ? 'sebagian' : 'semua');
    setPickupNotes(item.pickup_notes || '');
    setPaymentOption(sisa <= 0 ? 'none' : 'full');
    setCustomPayment('');
  };

  const handlePrevMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  const handleCurrentMonth = () => setSelectedMonth(new Date());

  // LOGIKA FILTER & SORTING
  const filteredData = useMemo(() => {
    let result = [...transactions];

    const targetMonth = selectedMonth.getMonth();
    const targetYear = selectedMonth.getFullYear();

    result = result.filter(t => {
      const orderDate = new Date(t.created_at || t.order_date || new Date());
      return orderDate.getMonth() === targetMonth && orderDate.getFullYear() === targetYear;
    });

    if (statusFilter === 'Belum Diambil') {
      result = result.filter(t => t.pickup_status !== 'Diambil' && t.pickup_status !== 'Diambil Semua');
    } else if (statusFilter === 'Diambil Sebagian') {
      result = result.filter(t => t.pickup_status === 'Diambil Sebagian');
    } else if (statusFilter === 'Sudah Diambil') {
      result = result.filter(t => t.pickup_status === 'Diambil' || t.pickup_status === 'Diambil Semua');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.invoice_no || '').toLowerCase().includes(q) ||
        (t.umkm_name || '').toLowerCase().includes(q) ||
        (t.phone || '').includes(q)
      );
    }

    // SORTING: Belum Diambil & Diambil Sebagian BANYAK DITARUH DI ATAS!
    return result.sort((a, b) => {
      const isAComplete = a.pickup_status === 'Diambil' || a.pickup_status === 'Diambil Semua';
      const isBComplete = b.pickup_status === 'Diambil' || b.pickup_status === 'Diambil Semua';
      
      if (isAComplete !== isBComplete) return isAComplete ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [transactions, selectedMonth, statusFilter, searchQuery]);

  // Eksekusi Submit Modal
  const executePenyerahan = async () => {
    if(!pickupModalData) return;

    const total = pickupModalData.total_amount || 0;
    const dp = pickupModalData.dp_amount || 0;
    const sisa = Math.max(0, total - dp);

    let isFullPayment = false;
    let addPay = 0;

    if (sisa > 0) {
      if (paymentOption === 'full') {
        isFullPayment = true;
      } else if (paymentOption === 'custom') {
        addPay = parseInt(customPayment || 0, 10);
        if (addPay <= 0) return toast.warning("Masukkan nominal bayar tambahan yang valid");
        if (addPay >= sisa) isFullPayment = true;
      }
    }

    const finalPickupStatus = pickupType === 'semua' ? 'Diambil Semua' : 'Diambil Sebagian';

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/transactions/${pickupModalData.invoice_no}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pickup_status: finalPickupStatus, 
          pickup_notes: pickupNotes,
          additional_payment: addPay,
          is_full_payment: isFullPayment
        })
      });
      const result = await res.json();
      if(res.ok && result.ok) {
        toast.success(`Pengambilan (${finalPickupStatus}) & Pembayaran berhasil disimpan!`);
        setPickupModalData(null);
        handleRefresh();
      } else {
        toast.error(result.error || "Gagal mengupdate status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatRp = (angka) => `Rp ${parseInt(angka || 0).toLocaleString('id-ID')}`;
  const monthText = selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PackageCheck className="text-teal-600" /> Daftar Pengambilan Barang
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola penyerahan barang (penuh/sebagian) dan pelunasan pembayaran pelanggan.</p>
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
        
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            
            {/* Navigasi Bulan */}
            <div className="flex items-center gap-2 w-full xl:w-auto bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer">
                <ChevronLeft size={18} />
              </Button>
              <div className="w-40 text-center font-bold text-slate-700 text-sm flex items-center justify-center gap-2">
                <Calendar size={14} className="text-primary" /> {monthText}
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer">
                <ChevronRight size={18} />
              </Button>
              <div className="h-6 w-px bg-slate-200 mx-1"></div>
              <Button variant="ghost" size="sm" onClick={handleCurrentMonth} className="h-8 text-xs font-semibold text-primary hover:bg-blue-50 px-3 cursor-pointer">
                Bulan Ini
              </Button>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-white h-10 border-slate-200 shadow-sm font-medium">
                  <SelectValue placeholder="Status Pengambilan" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="Semua">Semua Status</SelectItem>
                  <SelectItem value="Belum Diambil">⚠️ Belum Diambil</SelectItem>
                  <SelectItem value="Diambil Sebagian">📦 Diambil Sebagian</SelectItem>
                  <SelectItem value="Sudah Diambil">✅ Sudah Diambil Semua</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="Cari Invoice / Nama UMKM..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-slate-200 shadow-sm h-10"
                />
              </div>
            </div>

          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6 py-4">Tgl & Invoice</TableHead>
                  <TableHead>UMKM / Telepon</TableHead>
                  <TableHead>Tagihan & Pelunasan</TableHead>
                  <TableHead>Progres Pabrik</TableHead>
                  <TableHead className="text-right pr-6">Status Pengambilan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary h-8 w-8" /></TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500 bg-slate-50/50">Tidak ada data untuk bulan {monthText}.</TableCell></TableRow>
                ) : (
                  filteredData.map((t) => {
                    const isFullyTaken = t.pickup_status === 'Diambil' || t.pickup_status === 'Diambil Semua';
                    const isPartialTaken = t.pickup_status === 'Diambil Sebagian';
                    const sisaTagihan = Math.max(0, (t.total_amount || 0) - (t.dp_amount || 0));

                    return (
                      <TableRow key={t.id} className={`transition-colors ${isFullyTaken ? 'bg-slate-50/50 opacity-70' : isPartialTaken ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'hover:bg-teal-50/30'}`}>
                        <TableCell className="pl-6 py-4">
                          <div className="text-xs text-slate-500 mb-0.5">
                            {new Date(t.created_at || new Date()).toLocaleDateString('id-ID')}
                          </div>
                          <div className={`font-mono font-bold ${isFullyTaken ? 'text-slate-600' : 'text-slate-800'}`}>{t.invoice_no}</div>
                        </TableCell>

                        <TableCell>
                          <div className={`font-bold ${isFullyTaken ? 'text-slate-600' : 'text-slate-800'}`}>{t.umkm_name}</div>
                          <div className="text-xs text-slate-500">{t.phone}</div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="font-bold text-slate-800">{formatRp(t.total_amount)}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge className={`${t.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} border-0`}>
                              {t.status}
                            </Badge>
                            {sisaTagihan > 0 && (
                              <span className="text-[11px] text-red-600 font-semibold">
                                Sisa: {formatRp(sisaTagihan)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {t.current_stage === 'Kasir' ? (
                            <Badge className="bg-teal-50 text-teal-700 border-teal-200">🛍️ Siap Diambil</Badge>
                          ) : t.current_stage === 'Selesai' ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">✅ Selesai</Badge>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-1 rounded-md w-fit border border-amber-200">
                              <Loader2 size={12} className="animate-spin" /> {t.current_stage || 'Proses Pabrik'}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          {isFullyTaken ? (
                            <div className="flex items-center justify-end gap-1.5 text-slate-400 font-semibold text-xs sm:text-sm">
                              <CheckCircle2 size={16} className="text-emerald-500" /> Sudah Diambil Semua
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              {isPartialTaken && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] mb-1">
                                  📦 Diambil Sebagian
                                </Badge>
                              )}
                              <Button 
                                size="sm" 
                                className={`${isPartialTaken ? 'bg-amber-600 hover:bg-amber-500' : 'bg-teal-600 hover:bg-teal-500'} text-white font-bold cursor-pointer shadow-md text-xs h-9`} 
                                onClick={() => handleOpenPickupModal(t)}
                              >
                                <PackageCheck size={15} className="mr-1.5" /> 
                                {isPartialTaken ? 'Update / Lanjutkan Ambil' : 'Proses Pengambilan'}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL PROSES PENGAMBILAN & PEMBAYARAN */}
      <Dialog open={!!pickupModalData} onOpenChange={(open) => !open && setPickupModalData(null)}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 text-slate-800 shadow-2xl p-5 sm:p-6 rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-teal-700 text-xl font-bold">
              <PackageCheck size={22} /> Form Pengambilan & Pelunasan
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs sm:text-sm mt-1">
              Atur status penyerahan kemasan untuk UMKM <b className="text-slate-800">{pickupModalData?.umkm_name}</b> ({pickupModalData?.invoice_no}).
            </DialogDescription>
          </DialogHeader>

          {pickupModalData && (() => {
            const total = pickupModalData.total_amount || 0;
            const dp = pickupModalData.dp_amount || 0;
            const sisa = Math.max(0, total - dp);

            return (
              <div className="space-y-5 py-2">
                
                {/* Ringkasan Keuangan */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Tagihan:</span>
                    <span className="font-bold text-slate-800">{formatRp(total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Telah Dibayar (DP):</span>
                    <span className="font-semibold text-emerald-600">{formatRp(dp)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 pt-1 border-t border-slate-200 font-bold text-sm">
                    <span>Sisa Pembayaran:</span>
                    <span className={sisa > 0 ? 'text-red-600' : 'text-emerald-600'}>
                      {sisa > 0 ? formatRp(sisa) : 'LUNAS ✅'}
                    </span>
                  </div>
                </div>

                {/* 1. Opsi Jenis Pengambilan */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Box size={14} className="text-teal-600" /> Opsi Pengambilan Kemasan
                  </Label>
                  <RadioGroup value={pickupType} onValueChange={setPickupType} className="grid grid-cols-2 gap-3">
                    <div className={`flex items-center space-x-2 border-2 p-3 rounded-xl cursor-pointer transition-all ${pickupType === 'semua' ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <RadioGroupItem value="semua" id="type-semua" />
                      <Label htmlFor="type-semua" className="cursor-pointer font-bold text-xs sm:text-sm">
                        Ambil Semua (Penuh)
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-2 border-2 p-3 rounded-xl cursor-pointer transition-all ${pickupType === 'sebagian' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <RadioGroupItem value="sebagian" id="type-sebagian" />
                      <Label htmlFor="type-sebagian" className="cursor-pointer font-bold text-xs sm:text-sm text-amber-900">
                        Ambil Sebagian (Parsial)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Catatan Khusus Pengambilan Parsial */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Catatan / Rincian Pengambilan</Label>
                  <textarea 
                    rows={2} 
                    placeholder={pickupType === 'sebagian' ? 'Contoh: Diambil 500 Pcs dulu, sisa 500 Pcs ditinggal di toko' : 'Catatan tambahan (opsional)...'}
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* 2. Opsi Pembayaran Tambahan (Jika belum lunas) */}
                {sisa > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-600" /> Proses Pelunasan (Sisa: {formatRp(sisa)})
                    </Label>
                    <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="space-y-2">
                      <div className={`flex items-center justify-between border p-3 rounded-xl cursor-pointer ${paymentOption === 'full' ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200'}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full" id="pay-full" />
                          <Label htmlFor="pay-full" className="cursor-pointer font-bold text-xs sm:text-sm text-emerald-800">
                            Lunasi Seluruh Sisa
                          </Label>
                        </div>
                        <span className="font-bold text-emerald-700 text-xs">{formatRp(sisa)}</span>
                      </div>

                      <div className={`flex flex-col border p-3 rounded-xl cursor-pointer ${paymentOption === 'custom' ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200'}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="custom" id="pay-custom" />
                          <Label htmlFor="pay-custom" className="cursor-pointer font-bold text-xs sm:text-sm text-blue-900">
                            Bayar Sebagian (Cicilan Tambahan)
                          </Label>
                        </div>
                        {paymentOption === 'custom' && (
                          <div className="mt-2 pl-6">
                            <Input 
                              type="number" 
                              placeholder="Masukkan nominal bayar (Rp)"
                              value={customPayment}
                              onChange={(e) => setCustomPayment(e.target.value)}
                              className="h-9 text-xs bg-white border-slate-300"
                            />
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center space-x-2 border p-3 rounded-xl cursor-pointer ${paymentOption === 'none' ? 'border-amber-500 bg-amber-50/40' : 'border-slate-200'}`}>
                        <RadioGroupItem value="none" id="pay-none" />
                        <Label htmlFor="pay-none" className="cursor-pointer font-medium text-xs sm:text-sm text-slate-700">
                          Belum Ada Pembayaran Tambahan (Rp 0)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Status Tagihan: LUNAS. Tidak ada pembayaran tambahan.
                  </div>
                )}

              </div>
            );
          })()}

          <DialogFooter className="mt-2 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPickupModalData(null)} disabled={isUpdating} className="cursor-pointer h-10 text-xs">
              Batal
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer h-10 text-xs shadow-md gap-2" onClick={executePenyerahan} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16} />}
              Simpan & Proses Penyerahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}