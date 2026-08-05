import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, RefreshCw, Users, ArrowLeft, PlusCircle } from 'lucide-react';

// ==========================================
// HELPER FORMATTERS
// ==========================================

// Helper: Format Nama / Teks ke Title Case (Huruf Kapital Setiap Kata)
const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper: Format Nomor Telepon Indonesia
const formatPhoneNumber = (value) => {
  if (!value) return '';
  let cleaned = value.replace(/\D/g, ''); // Hapus semua karakter selain angka
  
  // Ubah awalan 628xx menjadi 08xx
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Batasi panjang nomor HP maksimal 13 digit
  cleaned = cleaned.slice(0, 13);

  // Format dengan tanda hubung (-) agar rapi dibaca: 0812-3456-7890
  if (cleaned.length > 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  } else if (cleaned.length > 4) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return cleaned;
};

export default function DataMitra() {
  const navigate = useNavigate();
  const [mitras, setMitras] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Default loading true untuk load pertama
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Structure awal form
  const initialForm = { nama_mitra: '', phone: '' };
  const initialProduct = { 
    id: '', 
    nama_produk: '', 
    merek: '', 
    label: '', 
    jenis_kemasan: '', 
    ukuran: '', 
    nib: '', 
    pirt: '', 
    halal: '', 
    catatan: '' 
  };
  
  const [formData, setFormData] = useState({
    ...initialForm,
    products: [{ ...initialProduct }]
  });

  // ==========================================
  // CLEAN ARCHITECTURE DATA FETCHING
  // ==========================================

  // 1. FUNGSI API MURNI
  const fetchMitrasAPI = async () => {
    const res = await fetch('/api/mitra');
    return await res.json();
  };

  // 2. EFFECT INITIAL LOAD (Aman dari Linter & Memory Leak)
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const json = await fetchMitrasAPI();
        
        if (!isMounted) return;
        
        if (json.success) {
          setMitras(json.data || []);
        } else {
          toast.error(json.message || "Gagal mengambil data mitra");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. FUNGSI UNTUK AKSI USER (Refresh/Simpan/Hapus)
  const fetchMitras = async () => {
    setIsLoading(true);
    try {
      const json = await fetchMitrasAPI();
      if (json.success) {
        setMitras(json.data || []);
      } else {
        toast.error(json.message || "Gagal mengambil data mitra");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLERS (MODAL & FORMS)
  // ==========================================

  // Buka Modal Tambah Mitra
  const handleOpenAdd = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData({
      ...initialForm,
      products: [{ ...initialProduct }]
    });
    setIsFormOpen(true);
  };

  // Buka Modal Edit Mitra
  const handleOpenEdit = (mitra) => {
    setIsEdit(true);
    setEditId(mitra.mitra_id || mitra.id);
    setFormData({
      nama_mitra: mitra.nama_mitra || '',
      phone: formatPhoneNumber(mitra.phone || ''),
      products: mitra.products && mitra.products.length > 0 
        ? mitra.products.map(p => ({
            id: p.id || '',
            nama_produk: p.nama_produk || '',
            merek: p.merek || '',
            label: p.label || '',
            jenis_kemasan: p.jenis_kemasan || '',
            ukuran: p.ukuran || '',
            nib: p.nib || '',
            pirt: p.pirt || '',
            halal: p.halal || '',
            catatan: p.catatan || ''
          }))
        : [{ ...initialProduct }]
    });
    setIsFormOpen(true);
  };

  // Handler Perubahan Form Utama (Mitra)
  const handleMitraChange = (field, value) => {
    if (field === 'nama_mitra') {
      setFormData(prev => ({ ...prev, [field]: toTitleCase(value) }));
    } else if (field === 'phone') {
      setFormData(prev => ({ ...prev, [field]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handler Perubahan Form Produk Dinamis
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    // Terapkan Title Case untuk atribut nama produk tertentu
    if (['nama_produk', 'merek', 'label', 'jenis_kemasan'].includes(field)) {
      updatedProducts[index][field] = toTitleCase(value);
    } else {
      updatedProducts[index][field] = value;
    }
    setFormData(prev => ({ ...prev, products: updatedProducts }));
  };

  // Tambah Baris Form Produk
  const handleAddProductField = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { ...initialProduct }]
    }));
  };

  // Hapus Baris Form Produk
  const handleRemoveProductField = (index) => {
    if (formData.products.length === 1) {
      toast.warning("Minimal harus ada 1 produk untuk mitra ini");
      return;
    }
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, products: updatedProducts }));
  };

  // Submit Handler (Tambah & Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_mitra || !formData.phone) {
      toast.error("Nama Mitra dan No Telp/WA wajib diisi");
      return;
    }

    for (let i = 0; i < formData.products.length; i++) {
      if (!formData.products[i].nama_produk) {
        toast.error(`Nama Produk ke-${i + 1} wajib diisi`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/mitra/${editId}` : '/api/mitra';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.data?.message || (isEdit ? "Data berhasil diperbarui" : "Mitra berhasil didaftarkan"));
        setIsFormOpen(false);
        fetchMitras(); // Refetch dengan fungsi trigger manual
      } else {
        toast.error(json.message || "Gagal menyimpan data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mitra/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success("Data berhasil dihapus");
        setDeleteId(null);
        fetchMitras(); // Refetch dengan fungsi trigger manual
      } else {
        toast.error(json.message || "Gagal menghapus data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Katalog Data Mitra</h1>
            <p className="text-sm text-slate-500">Kelola informasi mitra UMKM dan katalog produk kemasannya</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchMitras} disabled={isLoading} className="cursor-pointer">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Mitra Baru
          </Button>
        </div>
      </div>

      {/* Tabel Data Mitra */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Daftar Mitra ({mitras.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : mitras.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Belum ada data mitra terdaftar. Klik "Tambah Mitra Baru" untuk mengisi.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Nama Mitra</TableHead>
                    <TableHead>No. Telp / WA</TableHead>
                    <TableHead>Katalog Produk</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mitras.map((mitra, idx) => (
                    <TableRow key={mitra.mitra_id || idx}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{mitra.nama_mitra}</TableCell>
                      <TableCell>{formatPhoneNumber(mitra.phone)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {mitra.products && mitra.products.length > 0 ? (
                            mitra.products.map((p, pIdx) => (
                              <Badge key={p.id || pIdx} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                {p.nama_produk} {p.merek ? `(${p.merek})` : ''}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs italic">Tanpa produk</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(mitra)} className="cursor-pointer text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteId(mitra.mitra_id || mitra.id)} className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog Form (Tambah / Edit Multi-Produk) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="text-xl">{isEdit ? "Edit Data Mitra & Katalog" : "Tambah Mitra Baru"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Ubah informasi mitra dan daftar produk kemasannya di bawah ini." : "Isi data mitra dan produk kemasan yang didaftarkan."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 py-2 space-y-6 overflow-y-auto flex-1">
            {/* Form Informasi Mitra */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Info Mitra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Mitra / UMKM *</label>
                  <Input
                    placeholder="Contoh: Bu Tejo Snack"
                    value={formData.nama_mitra}
                    onChange={(e) => handleMitraChange('nama_mitra', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">No. Telp / WA *</label>
                  <Input
                    placeholder="Contoh: 0812-3456-7890"
                    value={formData.phone}
                    onChange={(e) => handleMitraChange('phone', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Form Katalog Produk Dinamis */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Katalog Produk ({formData.products.length})</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddProductField} disabled={isSubmitting} className="cursor-pointer border-blue-300 text-blue-600 hover:bg-blue-50">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Tambah Produk Lain
                </Button>
              </div>

              {formData.products.map((p, index) => (
                <div key={index} className="p-4 border rounded-xl bg-slate-50/50 space-y-3 relative">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-blue-600 uppercase">Produk #{index + 1}</span>
                    {formData.products.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveProductField(index)} className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Hapus Item
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Produk *</label>
                      <Input
                        placeholder="Keripik Singkong"
                        value={p.nama_produk}
                        onChange={(e) => handleProductChange(index, 'nama_produk', e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Merek</label>
                      <Input
                        placeholder="Nani Snack"
                        value={p.merek}
                        onChange={(e) => handleProductChange(index, 'merek', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Jenis Kemasan</label>
                      <Input
                        placeholder="Standing Pouch Zipper"
                        value={p.jenis_kemasan}
                        onChange={(e) => handleProductChange(index, 'jenis_kemasan', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Ukuran</label>
                      <Input
                        placeholder="14x22 cm"
                        value={p.ukuran}
                        onChange={(e) => handleProductChange(index, 'ukuran', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">NIB</label>
                      <Input
                        placeholder="NIB..."
                        value={p.nib}
                        onChange={(e) => handleProductChange(index, 'nib', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">P-IRT</label>
                      <Input
                        placeholder="P-IRT..."
                        value={p.pirt}
                        onChange={(e) => handleProductChange(index, 'pirt', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Halal</label>
                      <Input
                        placeholder="No. Halal..."
                        value={p.halal}
                        onChange={(e) => handleProductChange(index, 'halal', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Catatan Tambahan</label>
                    <Input
                      placeholder="Laminasi Doff, Cetak Foil, dsb."
                      value={p.catatan}
                      onChange={(e) => handleProductChange(index, 'catatan', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" id="submit-btn" className="hidden"></button>
          </form>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="cursor-pointer">
              Batal
            </Button>
            <Button onClick={() => document.getElementById('submit-btn').click()} disabled={isSubmitting} className="cursor-pointer bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Menyimpan...</> : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
            <DialogDescription>Yakin ingin menghapus data mitra ini beserta seluruh katalog produknya dari sistem?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
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