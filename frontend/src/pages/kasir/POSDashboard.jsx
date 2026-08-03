import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, Trash2, Save, ShoppingCart, Menu, LogOut, Users, Search, Loader2, ArrowLeft 
} from 'lucide-react';
import KasirSidebar from '@/layouts/KasirSidebar';

const generateId = () => typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

export default function POSDashboard() {
  const { logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- STATE MODAL 2 TAHAP MITRA ---
  const [isMitraModalOpen, setIsMitraModalOpen] = useState(false);
  const [mitraList, setMitraList] = useState([]);
  const [isLoadingMitra, setIsLoadingMitra] = useState(false);
  const [searchMitraQuery, setSearchMitraQuery] = useState('');
  
  const [modalStep, setModalStep] = useState(1);
  const [selectedMitraGroup, setSelectedMitraGroup] = useState(null);
  const [checkedProducts, setCheckedProducts] = useState({});

  // --- STATE UTAMA KASIR ---
  const [umkm, setUmkm] = useState('');
  const [phone, setPhone] = useState('');
  const [deadline, setDeadline] = useState('');
  const [paymentType, setPaymentType] = useState('full');
  const [dpAmount, setDpAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState([
    { id: generateId(), nama: '', merek: '', label: '', jenis: '', legalitas: { nib: false, nibNo: '', pirt: false, pirtNo: '', halal: false, halalNo: '' }, catatan: '', qty: 1, harga: 0 }
  ]);

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 2);
    return today.toISOString().split('T')[0];
  };

  const handleUppercase = (setter) => (e) => setter(e.target.value.toUpperCase());

  // --- MODAL & FETCH LOGIC ---
  const fetchMitraFromAPI = async () => {
    const res = await fetch('/api/mitra');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat katalog mitra");
    return result.data.mitra || result.data;
  };

  const resetModalState = () => {
    setModalStep(1);
    setSelectedMitraGroup(null);
    setCheckedProducts({});
    setSearchMitraQuery('');
  };

  const handleOpenMitraModal = (open) => {
    setIsMitraModalOpen(open);
    if (open) {
      setIsLoadingMitra(true);
      fetchMitraFromAPI()
        .then((data) => setMitraList(data))
        .catch((err) => toast.error(err.message || "Gagal terhubung ke server"))
        .finally(() => setIsLoadingMitra(false));
    } else {
      setTimeout(resetModalState, 300);
    }
  };

  // PENGELOMPOKAN DATA (GROUPING) UNTUK TAHAP 1
  const groupedMitraMap = mitraList.reduce((acc, curr) => {
    const key = `${curr.nama_mitra}-${curr.phone}`;
    if (!acc[key]) {
      acc[key] = { nama_mitra: curr.nama_mitra, phone: curr.phone, products: [] };
    }
    acc[key].products.push(curr);
    return acc;
  }, {});
  
  const groupedMitraArray = Object.values(groupedMitraMap);
  const filteredGroups = groupedMitraArray.filter(g => 
    g.nama_mitra.toLowerCase().includes(searchMitraQuery.toLowerCase()) ||
    g.products.some(p => p.nama_produk.toLowerCase().includes(searchMitraQuery.toLowerCase()) || (p.merek && p.merek.toLowerCase().includes(searchMitraQuery.toLowerCase())))
  );

  const handleSelectGroup = (group) => {
    setSelectedMitraGroup(group);
    setModalStep(2);
    const initialChecks = {};
    group.products.forEach(p => initialChecks[p.id] = false);
    setCheckedProducts(initialChecks);
  };

  const handleToggleProduct = (productId, isChecked) => {
    setCheckedProducts(prev => ({ ...prev, [productId]: isChecked }));
  };

  const handleAddSelectedProducts = () => {
    const productsToAdd = selectedMitraGroup.products.filter(p => checkedProducts[p.id]);
    if (productsToAdd.length === 0) return;

    setUmkm(selectedMitraGroup.nama_mitra);
    setPhone(selectedMitraGroup.phone);

    const newItems = productsToAdd.map(mitra => ({
      id: generateId(),
      nama: mitra.nama_produk || '',
      merek: mitra.merek || '',
      label: mitra.label || '',
      jenis: mitra.jenis_kemasan || '',
      legalitas: {
        nib: !!mitra.nib, nibNo: mitra.nib || '',
        pirt: !!mitra.pirt, pirtNo: mitra.pirt || '',
        halal: !!mitra.halal, halalNo: mitra.halal || ''
      },
      catatan: mitra.catatan || '',
      qty: 1,
      harga: 0
    }));

    if (items.length === 1 && !items[0].nama && !items[0].merek) {
      setItems([...newItems]);
    } else {
      setItems([...items, ...newItems]);
    }

    toast.success(`${productsToAdd.length} produk dari Mitra ${selectedMitraGroup.nama_mitra} berhasil dimuat!`);
    setIsMitraModalOpen(false);
  };

  // --- HANDLER ITEMS ---
  const addItem = () => {
    setItems([...items, { id: generateId(), nama: '', merek: '', label: '', jenis: '', legalitas: { nib: false, nibNo: '', pirt: false, pirtNo: '', halal: false, halalNo: '' }, catatan: '', qty: 1, harga: 0 }]);
  };
  
  const removeItem = (idToRemove) => {
    if (items.length === 1) return toast.warning("Minimal harus ada 1 pesanan kemasan");
    setItems(items.filter(item => item.id !== idToRemove));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateLegalitasCheck = (id, key, checked) => {
    setItems(items.map(item => item.id === id ? { ...item, legalitas: { ...item.legalitas, [key]: checked, [`${key}No`]: checked ? item.legalitas[`${key}No`] : '' } } : item));
  };

  const updateLegalitasNo = (id, keyNo, value) => {
    setItems(items.map(item => item.id === id ? { ...item, legalitas: { ...item.legalitas, [keyNo]: value } } : item));
  };

  const subTotal = items.reduce((acc, item) => acc + (item.qty * item.harga), 0);
  const grandTotal = Math.max(0, subTotal - discount);

  const handleSubmit = async () => {
    if (!umkm || !phone || !deadline) return toast.warning("Mohon lengkapi Data Pelanggan & Deadline");
    const invalidItems = items.some(i => !i.nama || !i.merek || !i.label || !i.jenis || i.qty <= 0);
    if (invalidItems) return toast.warning("Mohon lengkapi detail seluruh kemasan (Nama, Merek, Jenis, Qty)");

    setIsSubmitting(true);
    try {
      const payload = { umkm, phone, deadline, paymentType, dpAmount, discount, grandTotal, items };
      const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json();

      if (res.ok && result.ok) {
        toast.success(`Berhasil! Nomor Invoice: ${result.data.invoiceNo}`);
        setUmkm(''); setPhone(''); setDeadline(''); setPaymentType('full'); setDpAmount(0); setDiscount(0);
        setItems([{ id: generateId(), nama: '', merek: '', label: '', jenis: '', legalitas: { nib: false, nibNo: '', pirt: false, pirtNo: '', halal: false, halalNo: '' }, catatan: '', qty: 1, harga: 0 }]);
        window.open(`/kasir/invoice/${result.data.invoiceNo}`, '_blank');
      } else {
        toast.error("Gagal memproses pesanan", { description: result.error });
      }
    } catch (err) {
      console.error("Submit Error:", err);
      toast.error("Terjadi kesalahan pada server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = Object.values(checkedProducts).filter(Boolean).length;

  return (
    <div className="h-[100dvh] bg-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* SIDEBAR COMPONENT (OFF-CANVAS) */}
      <KasirSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* HEADER UTAMA (TAMPIL DI SEMUA UKURAN LAYAR) */}
      <header className="bg-white h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)} 
            className="text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg cursor-pointer"
            title="Buka Menu Navigasi"
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

      {/* AREA UTAMA WORKSPACE KASIR */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col lg:flex-row gap-6 overflow-y-auto max-w-[1700px] mx-auto w-full">
        
        {/* KIRI: Form Input Pelanggan & Kemasan */}
        <div className="flex-1 space-y-6">
          
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Data Pelanggan & Pemesanan</CardTitle>
                <CardDescription className="text-xs">Isi identitas pemesan dan tanggal kesepakatan.</CardDescription>
              </div>

              {/* MODAL MITRA 2 TAHAP */}
              <Dialog open={isMitraModalOpen} onOpenChange={handleOpenMitraModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 gap-1.5 cursor-pointer shrink-0">
                    <Search size={15} /> Pilih dari Data Mitra
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl bg-white max-h-[85vh] flex flex-col p-6">
                  
                  {modalStep === 1 && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800">
                          <Users size={20} className="text-primary" /> Pilih Klien / Mitra UMKM
                        </DialogTitle>
                        <DialogDescription>Cari dan pilih nama mitra untuk melihat daftar kemasannya.</DialogDescription>
                      </DialogHeader>
                      <div className="relative my-2 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input placeholder="Cari nama mitra atau produk..." className="pl-9 bg-slate-50" value={searchMitraQuery} onChange={(e) => setSearchMitraQuery(e.target.value)} />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
                        {isLoadingMitra ? (
                          <div className="py-12 text-center text-slate-500"><Loader2 className="animate-spin h-6 w-6 text-primary mx-auto mb-2" /></div>
                        ) : filteredGroups.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-sm">Tidak ada data mitra yang sesuai.</div>
                        ) : (
                          filteredGroups.map((g, idx) => (
                            <div key={idx} onClick={() => handleSelectGroup(g)} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-between group">
                              <div>
                                <div className="font-bold text-slate-800 group-hover:text-primary">{g.nama_mitra}</div>
                                <div className="text-xs text-slate-500">WA: {g.phone} • {g.products.length} Produk Terdaftar</div>
                              </div>
                              <Button size="sm" variant="ghost" className="text-primary">Lihat Produk</Button>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}

                  {modalStep === 2 && selectedMitraGroup && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800">
                          Pilih Produk dari {selectedMitraGroup.nama_mitra}
                        </DialogTitle>
                        <DialogDescription>Centang satu atau beberapa produk yang ingin ditambahkan ke pesanan.</DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2 border-t pt-4">
                        {selectedMitraGroup.products.map((p) => (
                          <label key={p.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                            <Checkbox 
                              checked={checkedProducts[p.id] || false} 
                              onCheckedChange={(c) => handleToggleProduct(p.id, c)} 
                              className="mt-1"
                            />
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{p.nama_produk}</div>
                              <div className="text-xs text-slate-500">Merek: {p.merek || '-'} | Kemasan: {p.jenis_kemasan || '-'} | Ukuran: {p.ukuran || '-'}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="pt-4 flex items-center justify-between border-t border-slate-100 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setModalStep(1)} className="text-slate-500 hover:text-slate-800">
                          <ArrowLeft size={16} className="mr-2" /> Kembali
                        </Button>
                        <Button onClick={handleAddSelectedProducts} disabled={selectedCount === 0}>
                          Tambahkan {selectedCount} Produk
                        </Button>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-xs font-semibold">Nama UMKM *</label><Input value={umkm} onChange={handleUppercase(setUmkm)} /></div>
              <div className="space-y-1"><label className="text-xs font-semibold">No. WhatsApp *</label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="space-y-1 sm:col-span-2"><label className="text-xs font-semibold text-red-600">Deadline (Min H+2) *</label><Input type="date" min={getMinDate()} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
            </CardContent>
          </Card>

          {/* List Kemasan Dipesan */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">Daftar Kemasan Dipesan</h2>
            <Button onClick={addItem} size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5 cursor-pointer gap-1"><Plus size={16} /> Tambah Kemasan</Button>
          </div>

          {items.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-primary bg-white border-slate-200 shadow-sm relative">
              <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-red-500 cursor-pointer" onClick={() => removeItem(item.id)}><Trash2 size={18} /></Button>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-semibold">Nama Kemasan *</label><Input value={item.nama} onChange={(e) => updateItem(item.id, 'nama', e.target.value.toUpperCase())} /></div>
                <div className="space-y-1"><label className="text-xs font-semibold">Merek *</label><Input value={item.merek} onChange={(e) => updateItem(item.id, 'merek', e.target.value.toUpperCase())} /></div>
                <div className="space-y-1"><label className="text-xs font-semibold">Label *</label><Input value={item.label} onChange={(e) => updateItem(item.id, 'label', e.target.value.toUpperCase())} /></div>
                <div className="space-y-1"><label className="text-xs font-semibold">Jenis *</label><Input value={item.jenis} onChange={(e) => updateItem(item.id, 'jenis', e.target.value.toUpperCase())} /></div>
                <div className="sm:col-span-2 p-4 bg-slate-50 border rounded-xl space-y-3">
                  <span className="text-xs font-bold block">Legalitas (Centang)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['nib', 'pirt', 'halal'].map(key => (
                      <div key={key} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                          <Checkbox checked={item.legalitas[key]} onCheckedChange={(c) => updateLegalitasCheck(item.id, key, c)} /> {key.toUpperCase()}
                        </label>
                        {item.legalitas[key] && <Input value={item.legalitas[`${key}No`]} onChange={(e) => updateLegalitasNo(item.id, `${key}No`, e.target.value)} className="bg-white text-xs" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1"><label className="text-xs font-semibold">Catatan</label><Input value={item.catatan} onChange={(e) => updateItem(item.id, 'catatan', e.target.value)} /></div>
                <div className="space-y-1"><label className="text-xs font-semibold">Quantity (Pcs) *</label><Input type="number" min="1" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)} /></div>
                <div className="space-y-1"><label className="text-xs font-semibold">Harga Satuan (Rp) *</label><Input type="number" min="0" value={item.harga} onChange={(e) => updateItem(item.id, 'harga', parseInt(e.target.value) || 0)} /></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* KANAN: Ringkasan Pembayaran */}
        <div className="w-full lg:w-[380px] shrink-0">
          <Card className="bg-white border-slate-200 shadow-sm flex flex-col h-full">
            <CardHeader className="border-b pb-4"><CardTitle className="text-base font-bold">Ringkasan Pembayaran</CardTitle></CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col gap-6">
              <div className="space-y-3 bg-slate-50 p-4 border rounded-xl">
                <div className="flex justify-between text-sm"><span>Sub Total</span><span className="font-semibold">Rp {subTotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between items-center text-sm"><span>Diskon (Rp)</span><Input type="number" className="w-28 text-right font-semibold bg-white" value={discount} onChange={(e) => setDiscount(parseInt(e.target.value) || 0)} /></div>
                <div className="flex justify-between text-lg font-bold border-t pt-3 text-emerald-600"><span>GRAND TOTAL</span><span>Rp {grandTotal.toLocaleString('id-ID')}</span></div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold">Opsi Pembayaran *</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={paymentType==='full'?'default':'outline'} onClick={()=>setPaymentType('full')} className={paymentType==='full'?'bg-emerald-600 text-white':''}>Full</Button>
                  <Button variant={paymentType==='dp'?'default':'outline'} onClick={()=>setPaymentType('dp')} className={paymentType==='dp'?'bg-amber-500 text-white':''}>DP</Button>
                  <Button variant={paymentType==='later'?'default':'outline'} onClick={()=>setPaymentType('later')} className={paymentType==='later'?'bg-slate-700 text-white':''}>Nanti</Button>
                </div>
              </div>
              {paymentType === 'dp' && (
                <div className="p-3 bg-amber-50 border-amber-200 border rounded-lg space-y-1">
                  <label className="text-xs font-bold text-amber-800">Nominal DP *</label>
                  <Input type="number" className="bg-white" value={dpAmount} onChange={(e) => setDpAmount(parseInt(e.target.value)||0)} />
                  <span className="text-[10px] text-amber-700">Sisa: Rp {Math.max(0, grandTotal - dpAmount).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="mt-auto pt-4">
                <Button size="lg" disabled={isSubmitting} onClick={handleSubmit} className="w-full h-12 gap-2 text-base font-bold bg-primary shadow-md cursor-pointer">
                  {isSubmitting ? <Loader2 className="animate-spin"/> : <><Save size={18}/> Simpan Pesanan</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}