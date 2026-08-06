import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import KasirSidebar from '@/layouts/KasirSidebar';
import { 
  Plus, Edit, Trash2, Loader2, RefreshCw, Users, PlusCircle, 
  Menu, LogOut, ShoppingCart, Package, Phone, Search, FileText
} from 'lucide-react';

// ==========================================
// HELPER FORMATTERS
// ==========================================

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatPhoneNumber = (value) => {
  if (!value) return '';
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.startsWith('62')) cleaned = '0' + cleaned.slice(2);
  cleaned = cleaned.slice(0, 13);
  if (cleaned.length > 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  if (cleaned.length > 4) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  return cleaned;
};

export default function DataMitra() {
  const { logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [mitras, setMitras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [detailMitra, setDetailMitra] = useState(null); 
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const initialForm = { nama_mitra: '', phone: '' };
  const initialProduct = { 
    id: '', nama_produk: '', merek: '', label: '', 
    jenis_kemasan: '', ukuran: '', nib: '', pirt: '', halal: '', catatan: '', harga: 0 
  };
  
  const [formData, setFormData] = useState({ ...initialForm, products: [{ ...initialProduct }] });

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchMitrasAPI = async () => {
    const res = await fetch('/api/mitra');
    return await res.json();
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const json = await fetchMitrasAPI();
        if (!isMounted) return;
        if (json.ok) {
          setMitras(json.data?.mitra || json.data || []);
        } else {
          toast.error(json.error || "Gagal mengambil data mitra");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  const fetchMitras = async () => {
    setIsLoading(true);
    try {
      const json = await fetchMitrasAPI();
      if (json.ok) {
        setMitras(json.data?.mitra || json.data || []);
      } else {
        toast.error(json.error || "Gagal mengambil data mitra");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleOpenAdd = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData({ ...initialForm, products: [{ ...initialProduct }] });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (mitra) => {
    setIsEdit(true);
    setEditId(mitra.mitra_id || mitra.id);
    setFormData({
      nama_mitra: mitra.nama_mitra || '',
      phone: formatPhoneNumber(mitra.phone || ''),
      products: mitra.products && mitra.products.length > 0 
        ? mitra.products.map(p => ({
            id: p.id || '', nama_produk: p.nama_produk || '', merek: p.merek || '',
            label: p.label || '', jenis_kemasan: p.jenis_kemasan || '', ukuran: p.ukuran || '',
            nib: p.nib || '', pirt: p.pirt || '', halal: p.halal || '', catatan: p.catatan || '', harga: p.harga || 0
          }))
        : [{ ...initialProduct }]
    });
    setIsFormOpen(true);
  };

  const handleMitraChange = (field, value) => {
    if (field === 'nama_mitra') setFormData(prev => ({ ...prev, [field]: toTitleCase(value) }));
    else if (field === 'phone') setFormData(prev => ({ ...prev, [field]: formatPhoneNumber(value) }));
    else setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    if (['nama_produk', 'merek', 'label', 'jenis_kemasan'].includes(field)) {
      updatedProducts[index][field] = toTitleCase(value);
    } else {
      updatedProducts[index][field] = value;
    }
    setFormData(prev => ({ ...prev, products: updatedProducts }));
  };

  const handleAddProductField = () => setFormData(prev => ({ ...prev, products: [...prev.products, { ...initialProduct }] }));

  const handleRemoveProductField = (index) => {
    if (formData.products.length === 1) return toast.warning("Minimal harus ada 1 produk untuk mitra ini");
    setFormData(prev => ({ ...prev, products: formData.products.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_mitra || !formData.phone) return toast.error("Nama Mitra dan No Telp/WA wajib diisi");
    for (let i = 0; i < formData.products.length; i++) {
      if (!formData.products[i].nama_produk) return toast.error(`Nama Produk ke-${i + 1} wajib diisi`);
    }

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/mitra/${editId}` : '/api/mitra';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const json = await res.json();
      
      if (json.ok) {
        toast.success(json.data?.message || (isEdit ? "Data berhasil diperbarui" : "Mitra berhasil didaftarkan"));
        setIsFormOpen(false);
        fetchMitras();
      } else {
        toast.error(json.error || "Gagal menyimpan data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mitra/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success(json.data?.message || "Data berhasil dihapus");
        setDeleteId(null);
        fetchMitras();
      } else {
        toast.error(json.error || "Gagal menghapus data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMitras = mitras.filter(m => 
    m.nama_mitra?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone?.includes(searchQuery)
  );

  return (
    <div className="h-[100dvh] bg-slate-100 flex flex-col font-sans overflow-hidden">
      <KasirSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <header className="bg-white h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg cursor-pointer">
            <Menu size={22} />
          </Button>
          <div className="flex items-center gap-2.5 text-primary font-bold text-lg tracking-tight">
            <ShoppingCart size={22} /> SIMKEMAS POS
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">💻 Mode Kasir Fokus</span>
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 hover:bg-red-50 font-bold gap-1.5 cursor-pointer px-2 sm:px-3">
            <LogOut size={16} /><span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-[1700px] mx-auto w-full flex flex-col gap-6">
        <Card className="border-slate-200 shadow-sm shrink-0 bg-white">
          <CardContent className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Users className="text-blue-600" /> Katalog Data Mitra
              </h1>
              <p className="text-sm text-slate-500 mt-1">Kelola direktori UMKM dan rincian produk kemasannya.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input placeholder="Cari nama / WA..." className="pl-9 bg-slate-50 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                <Button variant="outline" onClick={fetchMitras} disabled={isLoading} className="cursor-pointer flex-1 sm:flex-none">
                  <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 cursor-pointer flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-1.5" /> Tambah Mitra
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 flex-1"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
        ) : filteredMitras.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl flex-1 flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Tidak ada data mitra ditemukan.</p>
            <p className="text-sm mt-1">Gunakan tombol "Tambah Mitra" untuk mendaftarkan klien baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {filteredMitras.map((mitra, idx) => (
              <Card key={mitra.mitra_id || idx} className="hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col bg-white border-slate-200 group" onClick={() => setDetailMitra(mitra)}>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users size={22} /></div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">{mitra.products?.length || 0} Produk</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">{mitra.nama_mitra}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-1.5"><Phone size={14} className="text-emerald-600" /> {formatPhoneNumber(mitra.phone)}</div>
                  <div className="mt-auto pt-5 flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border-slate-200" onClick={(e) => { e.stopPropagation(); handleOpenEdit(mitra); }}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-slate-600 hover:text-red-700 hover:bg-red-50 border-slate-200" onClick={(e) => { e.stopPropagation(); setDeleteId(mitra.mitra_id || mitra.id); }}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* DETAIL MODAL */}
      <Dialog open={!!detailMitra} onOpenChange={(open) => !open && setDetailMitra(null)}>
        <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 bg-slate-50">
            <DialogTitle className="text-xl flex items-center gap-2.5 text-slate-800"><Package className="text-blue-600" /> Katalog: {detailMitra?.nama_mitra}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 mt-1 font-medium text-slate-600"><Phone size={14}/> {formatPhoneNumber(detailMitra?.phone)}</DialogDescription>
          </DialogHeader>
          <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
            {detailMitra?.products && detailMitra.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detailMitra.products.map((p, pIdx) => (
                  <div key={p.id || pIdx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative">
                    <Badge className="absolute top-4 right-4 bg-blue-50 text-blue-700 hover:bg-blue-50 border-none shadow-none">#{pIdx + 1}</Badge>
                    <h4 className="font-bold text-slate-800 pr-16 whitespace-normal break-words text-base leading-tight">{p.nama_produk}</h4>
                    <p className="text-xs font-semibold text-blue-600 mb-4 whitespace-normal break-words">Merek: {p.merek || '-'}</p>
                    
                    <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 shrink-0">Kemasan:</span> <span className="font-semibold text-slate-700 text-right whitespace-normal break-words">{p.jenis_kemasan || '-'}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 shrink-0">Ukuran:</span> <span className="font-semibold text-slate-700 text-right whitespace-normal break-words">{p.ukuran || '-'}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 shrink-0">Harga:</span> 
                        <span className="font-bold text-emerald-600 text-right whitespace-normal break-words">
                          {p.harga ? `Rp ${p.harga.toLocaleString('id-ID')}` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2 mt-2 pt-2 border-t border-slate-200">
                        <span className="text-slate-500 shrink-0">NIB:</span> <span className="font-semibold text-slate-700 text-right break-all">{p.nib || '-'}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 shrink-0">P-IRT:</span> <span className="font-semibold text-slate-700 text-right break-all">{p.pirt || '-'}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 shrink-0">Halal:</span> <span className="font-semibold text-slate-700 text-right break-all">{p.halal || '-'}</span>
                      </div>
                    </div>
                    {p.catatan && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-500 block mb-1">Catatan Tambahan:</span>
                        <p className="text-xs text-slate-700 whitespace-normal break-words leading-relaxed">{p.catatan}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 italic bg-white rounded-xl border border-dashed">Tidak ada produk dalam katalog mitra ini.</div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-white">
            <Button onClick={() => setDetailMitra(null)} className="w-full sm:w-auto cursor-pointer font-bold">Tutup Katalog</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT FORM MODAL */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="text-xl">{isEdit ? "Edit Data Mitra & Katalog" : "Tambah Mitra Baru"}</DialogTitle>
            <DialogDescription>{isEdit ? "Ubah informasi mitra dan daftar produk kemasannya di bawah ini." : "Isi data mitra dan produk kemasan yang didaftarkan."}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 py-2 space-y-6 overflow-y-auto flex-1">
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Info Mitra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Mitra / UMKM *</label><Input placeholder="Contoh: Bu Tejo Snack" value={formData.nama_mitra} onChange={(e) => handleMitraChange('nama_mitra', e.target.value)} disabled={isSubmitting} required /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1 block">No. Telp / WA *</label><Input placeholder="Contoh: 0812-3456-7890" value={formData.phone} onChange={(e) => handleMitraChange('phone', e.target.value)} disabled={isSubmitting} required /></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Katalog Produk ({formData.products.length})</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddProductField} disabled={isSubmitting} className="cursor-pointer border-blue-300 text-blue-600 hover:bg-blue-50">
                  <PlusCircle className="h-4 w-4 mr-1" /> Tambah Produk
                </Button>
              </div>

              {formData.products.map((p, index) => (
                <div key={index} className="p-4 border rounded-xl bg-slate-50/50 space-y-3 relative">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-blue-600 uppercase">Produk #{index + 1}</span>
                    {formData.products.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveProductField(index)} className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block">Nama Produk *</label><Input placeholder="Keripik Singkong" value={p.nama_produk} onChange={(e) => handleProductChange(index, 'nama_produk', e.target.value)} required /></div>
                    <div><label className="text-xs font-medium mb-1 block">Merek</label><Input placeholder="Nani Snack" value={p.merek} onChange={(e) => handleProductChange(index, 'merek', e.target.value)} /></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div><label className="text-xs font-medium mb-1 block">Jenis Kemasan</label><Input placeholder="Standing Pouch Zipper" value={p.jenis_kemasan} onChange={(e) => handleProductChange(index, 'jenis_kemasan', e.target.value)} /></div>
                    <div><label className="text-xs font-medium mb-1 block">Ukuran</label><Input placeholder="14x22 cm" value={p.ukuran} onChange={(e) => handleProductChange(index, 'ukuran', e.target.value)} /></div>
                    <div>
                      <label className="text-xs font-medium mb-1 block text-emerald-700">Harga Satuan (Rp)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Rp</span>
                        <Input 
                          className="pl-9 font-semibold text-emerald-700" 
                          placeholder="0" 
                          value={p.harga ? p.harga.toLocaleString('id-ID') : ''} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            handleProductChange(index, 'harga', val ? parseInt(val, 10) : 0);
                          }} 
                          disabled={isSubmitting} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div><label className="text-xs font-medium mb-1 block">NIB</label><Input placeholder="NIB..." value={p.nib} onChange={(e) => handleProductChange(index, 'nib', e.target.value)} /></div>
                    <div><label className="text-xs font-medium mb-1 block">P-IRT</label><Input placeholder="P-IRT..." value={p.pirt} onChange={(e) => handleProductChange(index, 'pirt', e.target.value)} /></div>
                    <div><label className="text-xs font-medium mb-1 block">Halal</label><Input placeholder="No. Halal..." value={p.halal} onChange={(e) => handleProductChange(index, 'halal', e.target.value)} /></div>
                  </div>
                  <div><label className="text-xs font-medium mb-1 block">Catatan Tambahan</label><Input placeholder="Laminasi Doff, Cetak Foil, dsb." value={p.catatan} onChange={(e) => handleProductChange(index, 'catatan', e.target.value)} /></div>
                </div>
              ))}
            </div>
            <button type="submit" id="submit-btn" className="hidden"></button>
          </form>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="cursor-pointer">Batal</Button>
            <Button onClick={() => document.getElementById('submit-btn').click()} disabled={isSubmitting} className="cursor-pointer bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Menyimpan...</> : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
            <DialogDescription>Yakin ingin menghapus data mitra ini beserta seluruh katalog produknya dari sistem?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isSubmitting} className="cursor-pointer">Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}