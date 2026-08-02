import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, Trash2, Save, ShoppingCart, Menu, X, LogOut, Package, Users, Search, Loader2, Wallet, FileText, ListOrdered
} from 'lucide-react';

const generateId = () => typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

export default function POSDashboard() {
  const { user, logout } = useAuthStore();
  
  // State Mobile Sidebar / Drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Modal Pilih Data Mitra
  const [isMitraModalOpen, setIsMitraModalOpen] = useState(false);
  const [mitraList, setMitraList] = useState([]);
  const [isLoadingMitra, setIsLoadingMitra] = useState(false);
  const [searchMitraQuery, setSearchMitraQuery] = useState('');

  // State Pelanggan
  const [umkm, setUmkm] = useState('');
  const [phone, setPhone] = useState('');
  
  // State Pembayaran & Deadline
  const [deadline, setDeadline] = useState('');
  const [paymentType, setPaymentType] = useState('full'); // full, dp, later
  const [dpAmount, setDpAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Dynamic Items (Bisa lebih dari 1 pesanan)
  const [items, setItems] = useState([
    { 
      id: 1, 
      nama: '', 
      merek: '', 
      label: '', 
      jenis: '', 
      legalitas: { 
        nib: false, nibNo: '', 
        pirt: false, pirtNo: '', 
        halal: false, halalNo: '' 
      }, 
      catatan: '', 
      qty: 1, 
      harga: 0 
    }
  ]);

  // Validasi Kalender: Minimal 2 hari dari sekarang (H+2)
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 2);
    return today.toISOString().split('T')[0];
  };

  // Helper Auto-Uppercase
  const handleUppercase = (setter) => (e) => setter(e.target.value.toUpperCase());

  // Fetch Data Mitra untuk Modal Pencarian
  // 1. FUNGSI FETCH MURNI (Tanpa menyentuh React State)
  const fetchMitraFromAPI = async () => {
    const res = await fetch('/api/mitra');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat katalog mitra");
    return result.data.mitra;
  };

  // 2. HANDLER SAAT MODAL DIBUKA (Menggantikan fungsi useEffect)
  const handleOpenMitraModal = (open) => {
    setIsMitraModalOpen(open); // Update state buka/tutup modal
    
    // Jika modal dibuka, baru kita jalankan fetch
    if (open) {
      setIsLoadingMitra(true); // Bebas linter error karena ini di dalam event handler, bukan effect!
      fetchMitraFromAPI()
        .then((data) => setMitraList(data))
        .catch((err) => {
          console.error(err);
          toast.error(err.message || "Gagal terhubung ke server");
        })
        .finally(() => setIsLoadingMitra(false));
    }
  };

  // AUTO-FILL DATA MITRA KE FORM
  const handleSelectMitra = (mitra) => {
    // 1. Isi Data Pelanggan
    setUmkm(mitra.nama_mitra);
    setPhone(mitra.phone);

    // 2. Buat objek item baru berdasarkan data mitra
    const newItem = {
      id: generateId(),
      nama: mitra.nama_produk || '',
      merek: mitra.merek || '',
      label: mitra.label || '',
      jenis: mitra.jenis_kemasan || '',
      legalitas: {
        nib: !!mitra.nib,
        nibNo: mitra.nib || '',
        pirt: !!mitra.pirt,
        pirtNo: mitra.pirt || '',
        halal: !!mitra.halal,
        halalNo: mitra.halal || ''
      },
      catatan: mitra.catatan || '',
      qty: 1,
      harga: 0
    };

    // Jika form item pertama masih kosong bersih, timpa. Jika sudah diisi, tambahkan sebagai item baru.
    if (items.length === 1 && !items[0].nama && !items[0].merek) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }

    setIsMitraModalOpen(false);
    toast.success(`Data produk ${mitra.nama_produk} (${mitra.nama_mitra}) berhasil dimuat!`);
  };

  // Helper Manage Items
  const addItem = () => {
    setItems([
      ...items, 
      { 
        id: generateId(), 
        nama: '', 
        merek: '', 
        label: '', 
        jenis: '', 
        legalitas: { nib: false, nibNo: '', pirt: false, pirtNo: '', halal: false, halalNo: '' }, 
        catatan: '', 
        qty: 1, 
        harga: 0 
      }
    ]);
  };
  
  const removeItem = (idToRemove) => {
    if (items.length === 1) return toast.warning("Minimal harus ada 1 pesanan kemasan");
    setItems(items.filter(item => item.id !== idToRemove));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateLegalitasCheck = (id, key, checked) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          legalitas: {
            ...item.legalitas,
            [key]: checked,
            [`${key}No`]: checked ? item.legalitas[`${key}No`] : ''
          }
        };
      }
      return item;
    }));
  };

  const updateLegalitasNo = (id, keyNo, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          legalitas: {
            ...item.legalitas,
            [keyNo]: value
          }
        };
      }
      return item;
    }));
  };

  // Kalkulasi Total
  const subTotal = items.reduce((acc, item) => acc + (item.qty * item.harga), 0);
  const grandTotal = Math.max(0, subTotal - discount);

  // HANDLE SUBMIT ORDERS TO BACKEND
  const handleSubmit = async () => {
    if (!umkm || !phone || !deadline) {
      return toast.warning("Mohon lengkapi Data Pelanggan & Deadline");
    }

    const invalidItems = items.some(i => !i.nama || !i.merek || !i.label || !i.jenis || i.qty <= 0);
    if (invalidItems) {
      return toast.warning("Mohon lengkapi detail seluruh kemasan (Nama, Merek, Jenis, Qty)");
    }

    setIsSubmitting(true);
    try {
      const payload = { umkm, phone, deadline, paymentType, dpAmount, discount, grandTotal, items };
      
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (res.ok && result.ok) {
        toast.success(`Berhasil! Nomor Invoice: ${result.data.invoiceNo}`);
        
        // Bersihkan Formulir
        setUmkm(''); setPhone(''); setDeadline('');
        setPaymentType('full'); setDpAmount(0); setDiscount(0);
        setItems([{ 
          id: generateId(), nama: '', merek: '', label: '', jenis: '', 
          legalitas: { nib: false, nibNo: '', pirt: false, pirtNo: '', halal: false, halalNo: '' }, 
          catatan: '', qty: 1, harga: 0 
        }]);

        window.open(`/kasir/invoice/${result.data.invoiceNo}`, '_blank');
      } else {
        toast.error("Gagal memproses pesanan", { description: result.error });
      }
    } catch (err) {
      console.error("Submit Order Error:", err);
      toast.error("Terjadi kesalahan pada server");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Mitra berdasarkan query pencarian
  const filteredMitra = mitraList.filter(m => 
    m.nama_mitra.toLowerCase().includes(searchMitraQuery.toLowerCase()) ||
    m.nama_produk.toLowerCase().includes(searchMitraQuery.toLowerCase()) ||
    (m.merek && m.merek.toLowerCase().includes(searchMitraQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer / Navigation Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
       <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Package size={22} /> SIMKEMAS POS
          </div>
          <button className="text-slate-500 hover:text-slate-800 cursor-pointer" onClick={() => setIsSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <Link to="/kasir" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-md font-medium text-sm">
            <ShoppingCart size={18} /> Transaksi Kasir (POS)
          </Link>
          <Link to="/kasir/mitra" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium text-sm transition-colors">
            <Users size={18} /> Data Mitra & Produk
          </Link>
          <Link to="/kasir/riwayat" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium text-sm transition-colors">
            <FileText size={18} /> Riwayat Nota & SPK
          </Link>
          <Link to="/kasir/tunggu" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium text-sm transition-colors">
            <ListOrdered size={18} /> Daftar Tunggu (Antrian)
          </Link>
          <Link to="/kasir/keuangan" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium text-sm transition-colors">
            <Wallet size={18} /> Pencatatan Arus Kas
          </Link>
        </nav>
      </aside>

      {/* Top Header Kasir */}
      <header className="bg-white h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Buka Menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 text-primary font-bold text-lg sm:text-xl">
            <ShoppingCart size={24} />
            <span className="hidden sm:inline">SIMKEMAS POS</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800">{user?.username}</span>
            <span className="text-xs text-slate-500">Kasir Operasional</span>
          </div>
          <Button variant="destructive" size="sm" onClick={logout} className="gap-2 cursor-pointer">
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Area Utama Dashboard */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden max-w-[1600px] mx-auto w-full">
        
        {/* KIRI: Area Form Input Pesanan (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-0 lg:pr-2">
          
          {/* Card Data Pelanggan */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Data Pelanggan & Pemesanan</CardTitle>
                <CardDescription className="text-xs">Isi identitas pemesan dan tanggal kesepakatan pengambilan barang.</CardDescription>
              </div>

              {/* FITUR TOMBOL SAKTI: PILIH DARI DATA MITRA */}
              <Dialog open={isMitraModalOpen} onOpenChange={handleOpenMitraModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 gap-1.5 cursor-pointer shrink-0">
                    <Search size={15} /> Pilih dari Data Mitra
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl bg-white max-h-[85vh] flex flex-col p-6">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-800">
                      <Users size={20} className="text-primary" /> Katalog Produk Mitra
                    </DialogTitle>
                    <DialogDescription>
                      Pilih produk mitra yang sudah terdaftar untuk mengisi form pesanan secara otomatis.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="relative my-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      placeholder="Cari berdasarkan UMKM, nama produk, atau merek..." 
                      className="pl-9 bg-slate-50"
                      value={searchMitraQuery}
                      onChange={(e) => setSearchMitraQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
                    {isLoadingMitra ? (
                      <div className="py-12 text-center text-slate-500">
                        <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-xs">Memuat katalog mitra...</p>
                      </div>
                    ) : filteredMitra.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        Tidak ada data mitra yang sesuai.
                      </div>
                    ) : (
                      filteredMitra.map((m) => (
                        <div 
                          key={m.id} 
                          onClick={() => handleSelectMitra(m)}
                          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 group-hover:text-primary transition-colors">
                              {m.nama_mitra}
                            </div>
                            <div className="text-xs font-semibold text-primary">
                              {m.nama_produk} {m.merek ? `(${m.merek})` : ''}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Jenis: {m.jenis_kemasan || '-'} | Ukuran: {m.ukuran || '-'} | WA: {m.phone}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                            Pilih
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama UMKM / Usaha *</label>
                <Input value={umkm} onChange={handleUppercase(setUmkm)} placeholder="Contoh: KERIPIK BU SITI" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">No. WhatsApp / Telp *</label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08123456789" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-red-600">Deadline Pengambilan (Minimal H+2) *</label>
                <Input type="date" min={getMinDate()} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Sub Header Keranjang */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">Daftar Kemasan Dipesan</h2>
            <Button onClick={addItem} size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5 cursor-pointer gap-1">
              <Plus size={16} /> Tambah Kemasan
            </Button>
          </div>

          {/* Dynamic Items Cards */}
          {items.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-primary bg-white border-slate-200 shadow-sm relative transition-all">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer" 
                onClick={() => removeItem(item.id)}
                title="Hapus Kemasan Ini"
              >
                <Trash2 size={18} />
              </Button>

              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nama Kemasan *</label>
                  <Input value={item.nama} onChange={(e) => updateItem(item.id, 'nama', e.target.value.toUpperCase())} placeholder="KEMASAN KERIPIK PISANG" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Merek Kemasan *</label>
                  <Input value={item.merek} onChange={(e) => updateItem(item.id, 'merek', e.target.value.toUpperCase())} placeholder="PISANGKU" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Label Kemasan *</label>
                  <Input value={item.label} onChange={(e) => updateItem(item.id, 'label', e.target.value.toUpperCase())} placeholder="RASA COKELAT LUMER" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jenis Kemasan *</label>
                  <Input value={item.jenis} onChange={(e) => updateItem(item.id, 'jenis', e.target.value.toUpperCase())} placeholder="STANDING POUCH, GUSSET, DLL" />
                </div>

                {/* Checkbox + Input Dinamis Legalitas */}
                <div className="sm:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">Legalitas Produk (Centang Jika Ada)</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* NIB */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <Checkbox 
                          checked={item.legalitas.nib} 
                          onCheckedChange={(c) => updateLegalitasCheck(item.id, 'nib', c)} 
                        /> 
                        NIB
                      </label>
                      {item.legalitas.nib && (
                        <Input 
                          placeholder="Masukkan No. NIB" 
                          value={item.legalitas.nibNo}
                          onChange={(e) => updateLegalitasNo(item.id, 'nibNo', e.target.value)}
                          className="bg-white text-xs"
                        />
                      )}
                    </div>

                    {/* PIRT */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <Checkbox 
                          checked={item.legalitas.pirt} 
                          onCheckedChange={(c) => updateLegalitasCheck(item.id, 'pirt', c)} 
                        /> 
                        PIRT
                      </label>
                      {item.legalitas.pirt && (
                        <Input 
                          placeholder="Masukkan No. PIRT" 
                          value={item.legalitas.pirtNo}
                          onChange={(e) => updateLegalitasNo(item.id, 'pirtNo', e.target.value)}
                          className="bg-white text-xs"
                        />
                      )}
                    </div>

                    {/* HALAL */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <Checkbox 
                          checked={item.legalitas.halal} 
                          onCheckedChange={(c) => updateLegalitasCheck(item.id, 'halal', c)} 
                        /> 
                        HALAL
                      </label>
                      {item.legalitas.halal && (
                        <Input 
                          placeholder="Masukkan No. HALAL" 
                          value={item.legalitas.halalNo}
                          onChange={(e) => updateLegalitasNo(item.id, 'halalNo', e.target.value)}
                          className="bg-white text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Catatan Pemesanan (Desain/Warna/Ukuran Khusus)</label>
                  <Input value={item.catatan} onChange={(e) => updateItem(item.id, 'catatan', e.target.value)} placeholder="Contoh: Tambah gambar maskot pisang di depan" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Quantity (Pcs) *</label>
                  <Input type="number" min="1" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Harga Satuan (Rp) *</label>
                  <Input type="number" min="0" value={item.harga} onChange={(e) => updateItem(item.id, 'harga', parseInt(e.target.value) || 0)} />
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

        {/* KANAN: Kalkulasi Ringkasan Pembayaran */}
        <div className="w-full lg:w-[380px] shrink-0">
          <Card className="bg-white border-slate-200 shadow-sm flex flex-col h-full">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800">Ringkasan Pembayaran</CardTitle>
              <CardDescription className="text-xs">Atur diskon dan opsi status pembayaran pesanan.</CardDescription>
            </CardHeader>

            <CardContent className="pt-6 flex-1 flex flex-col gap-6">
              
              {/* Rincian Angka */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Sub Total</span>
                  <span className="font-semibold text-slate-800">Rp {subTotal.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between text-sm items-center pt-1">
                  <span className="text-slate-600">Diskon Potongan (Rp)</span>
                  <Input 
                    type="number" 
                    className="w-28 bg-white h-8 text-right font-semibold text-slate-800" 
                    value={discount} 
                    onChange={(e) => setDiscount(parseInt(e.target.value) || 0)} 
                  />
                </div>

                <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200 text-emerald-600">
                  <span>GRAND TOTAL</span>
                  <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Opsi Jenis Pembayaran */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Opsi Pembayaran *</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    type="button"
                    variant={paymentType === 'full' ? 'default' : 'outline'} 
                    className={`cursor-pointer ${paymentType === 'full' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold' : 'text-slate-700'}`} 
                    onClick={() => setPaymentType('full')}
                  >
                    Bayar Full
                  </Button>
                  <Button 
                    type="button"
                    variant={paymentType === 'dp' ? 'default' : 'outline'} 
                    className={`cursor-pointer ${paymentType === 'dp' ? 'bg-amber-500 hover:bg-amber-600 text-white font-bold' : 'text-slate-700'}`} 
                    onClick={() => setPaymentType('dp')}
                  >
                    DP Dulu
                  </Button>
                  <Button 
                    type="button"
                    variant={paymentType === 'later' ? 'default' : 'outline'} 
                    className={`cursor-pointer ${paymentType === 'later' ? 'bg-slate-700 hover:bg-slate-800 text-white font-bold' : 'text-slate-700'}`} 
                    onClick={() => setPaymentType('later')}
                  >
                    Nanti
                  </Button>
                </div>
              </div>

              {/* Input Nominal DP jika pilih DP */}
              {paymentType === 'dp' && (
                <div className="space-y-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <label className="text-xs font-bold text-amber-800">Nominal DP Masuk (Rp) *</label>
                  <Input 
                    type="number" 
                    className="bg-white border-amber-300 font-semibold" 
                    value={dpAmount} 
                    onChange={(e) => setDpAmount(parseInt(e.target.value) || 0)} 
                  />
                  <span className="text-[10px] text-amber-700 block mt-1">
                    Sisa Pelunasan: <b>Rp {Math.max(0, grandTotal - dpAmount).toLocaleString('id-ID')}</b>
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-auto pt-4">
                <Button 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full font-bold text-base h-12 bg-primary hover:bg-primary/90 cursor-pointer gap-2 shadow-md" 
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={18} /> Memproses...</>
                  ) : (
                    <><Save size={18} /> Simpan & Buat Pesanan</>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}