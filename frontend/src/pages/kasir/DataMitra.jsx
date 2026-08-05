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

export default function DataMitra() {
  const navigate = useNavigate();
  const [mitras, setMitras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // State Form Dinamis (Mode Tambah)
  const initialForm = { nama_mitra: '', phone: '' };
  const initialProduct = { nama_produk: '', label: '', merek: '', jenis_kemasan: '', ukuran: '', nib: '', pirt: '', halal: '', catatan: '' };
  
  const [formData, setFormData] = useState(initialForm);
  const [products, setProducts] = useState([{ id: crypto.randomUUID(), ...initialProduct }]);
  
  // State Mode Edit (Flat / 1 Baris)
  const [editFormData, setEditFormData] = useState(null);

  // -----------------------------------------------------------
  // FUNGSI FETCH DATA (Dikhususkan untuk tombol Refresh & Submit)
  // -----------------------------------------------------------
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mitra');
      const result = await res.json();

      if (res.ok && result.ok) {
        setMitras(result.data.mitra || result.data); 
      } else {
        toast.error(result.error || "Gagal memuat data katalog");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------
  // 🛠️ USE EFFECT AMAN (Tanpa memicu Synchronous setState error)
  // -----------------------------------------------------------
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const res = await fetch('/api/mitra');
        const result = await res.json();
        if (ignore) return;

        if (res.ok && result.ok) {
          setMitras(result.data.mitra || result.data);
        } else {
          toast.error(result.error || "Gagal memuat data katalog");
        }
      } catch (err) {
        if (ignore) return;
        console.error(err);
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    load();

    return () => { ignore = true; };
  }, []);

  const handleRefresh = () => fetchData();

  // -----------------------------------------------------------
  // FUNGSI KENDALI ARRAY PRODUK (HANYA UNTUK MODE TAMBAH)
  // -----------------------------------------------------------
  const addProduct = () => {
    setProducts([...products, { id: crypto.randomUUID(), ...initialProduct }]);
  };

  const removeProduct = (id) => {
    if (products.length <= 1) return toast.warning("Minimal harus ada 1 produk untuk didaftarkan");
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id, field, value) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value.toUpperCase() } : p));
  };

  // -----------------------------------------------------------
  // FUNGSI KENDALI MODAL & SUBMIT
  // -----------------------------------------------------------
  const openAddForm = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData(initialForm);
    setProducts([{ id: crypto.randomUUID(), ...initialProduct }]);
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setIsEdit(true);
    setEditId(item.id);
    setEditFormData({ ...item }); 
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let url, method, body;

      if (isEdit) {
        // --- SUBMIT EDIT (FLAT) ---
        if (!editFormData.nama_mitra || !editFormData.phone || !editFormData.nama_produk) {
          toast.warning("Nama Mitra, No WA, dan Nama Produk wajib diisi");
          setIsSubmitting(false); return;
        }
        url = `/api/mitra/${editId}`;
        method = 'PUT';
        body = JSON.stringify(editFormData);
      } else {
        // --- SUBMIT TAMBAH BARU (DYNAMIC ARRAY) ---
        if (!formData.nama_mitra || !formData.phone) {
          toast.warning("Nama Mitra dan No Telp wajib diisi!");
          setIsSubmitting(false); return;
        }
        if (!products.every(p => p.nama_produk.trim() !== '')) {
          toast.warning("Setiap produk wajib mengisi Nama Produk!");
          setIsSubmitting(false); return;
        }
        url = '/api/mitra';
        method = 'POST';
        body = JSON.stringify({ nama_mitra: formData.nama_mitra, phone: formData.phone, products });
      }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      const result = await res.json();

      if (res.ok && result.ok) {
        toast.success(result.data.message || "Data berhasil disimpan");
        setIsFormOpen(false);
        fetchData(); // Panggil ulang data
      } else {
        toast.error("Gagal menyimpan data", { description: result.error });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mitra/${deleteId}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok && result.ok) {
        toast.success(result.data.message);
        setDeleteId(null);
        fetchData(); // Panggil ulang data
      } else {
        toast.error("Gagal menghapus", { description: result.error });
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-primary" /> Master Data Mitra & Produk</h1>
          <p className="text-slate-500 text-sm">Kelola database klien dan spesifikasi kemasannya untuk mempercepat pesanan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2 border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer">
            <ArrowLeft size={16} /> Kembali
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin':''}`} /> Refresh
          </Button>
          <Button onClick={openAddForm} className="gap-2 cursor-pointer">
            <Plus size={16}/> Tambah Mitra
          </Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Nama UMKM / Mitra</TableHead>
                  <TableHead>Kontak (WA)</TableHead>
                  <TableHead>Produk & Merek</TableHead>
                  <TableHead>Jenis & Ukuran</TableHead>
                  <TableHead>Legalitas</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="mx-auto animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : mitras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      Belum ada data mitra yang terdaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  mitras.map((mitra, index) => (
                    <TableRow key={mitra.phone || index} className="hover:bg-slate-50">
                      <TableCell className="font-bold text-slate-800">
                        {mitra.nama_mitra}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-600">
                        {mitra.phone}
                      </TableCell>
                      
                      {/* TAMPILAN BARU: Katalog Produk Menjadi Kumpulan Badge Dinamis */}
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {mitra.products && mitra.products.map(p => (
                            <Badge key={p.id} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm flex flex-col items-start px-3 py-1 text-xs">
                              <span className="font-bold">{p.nama_produk}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {p.jenis_kemasan} {p.ukuran && `- ${p.ukuran}`}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {new Date(mitra.joined_date).toLocaleDateString('id-ID')}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Sambungkan event onClick ke openEditForm */}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-amber-600 hover:bg-amber-50 cursor-pointer" 
                            onClick={() => openEditForm(mitra)} 
                          >
                            <Edit size={16} />
                          </Button>
                          
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-red-600 hover:bg-red-50 cursor-pointer" 
                            onClick={() => setDeleteId(mitra.phone)} 
                          >
                            <Trash2 size={16} />
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

      {/* Modal Form Tambah/Edit */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>{isEdit ? 'Edit Data Mitra' : 'Pendaftaran Mitra Baru'}</DialogTitle>
            <DialogDescription>Masukkan spesifikasi produk kemasan klien ke dalam sistem.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {!isEdit ? (
              // 🟢 MODE TAMBAH: Header Mitra + Array Produk Dinamis
              <>
                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Nama Mitra/UMKM *</label>
                    <Input value={formData.nama_mitra} onChange={(e) => setFormData({...formData, nama_mitra: e.target.value.toUpperCase()})} disabled={isSubmitting} className="bg-white" required/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">No Telp/WhatsApp *</label>
                    <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={isSubmitting} className="bg-white" required/>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="font-semibold text-slate-700 border-b pb-2">Daftar Produk Mitra</h3>
                  {products.map((p, idx) => (
                    <Card key={p.id} className="relative bg-slate-50 border-slate-200">
                      {products.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(p.id)} className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:bg-red-100 z-10 cursor-pointer">
                          <Trash2 size={16} />
                        </Button>
                      )}
                      <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-100/50">
                        <CardTitle className="text-sm">Produk #{idx + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="col-span-full space-y-1"><label className="text-xs font-medium">Nama Produk *</label><Input value={p.nama_produk} onChange={(e) => updateProduct(p.id, 'nama_produk', e.target.value)} disabled={isSubmitting} className="bg-white" required /></div>
                        <div className="space-y-1"><label className="text-xs font-medium">Merek</label><Input value={p.merek} onChange={(e) => updateProduct(p.id, 'merek', e.target.value)} disabled={isSubmitting} className="bg-white" /></div>
                        <div className="space-y-1"><label className="text-xs font-medium">Label/Varian</label><Input value={p.label} onChange={(e) => updateProduct(p.id, 'label', e.target.value)} disabled={isSubmitting} className="bg-white" /></div>
                        <div className="space-y-1"><label className="text-xs font-medium">Jenis Kemasan</label><Input value={p.jenis_kemasan} onChange={(e) => updateProduct(p.id, 'jenis_kemasan', e.target.value)} disabled={isSubmitting} className="bg-white" /></div>
                        <div className="space-y-1"><label className="text-xs font-medium">Ukuran</label><Input value={p.ukuran} onChange={(e) => updateProduct(p.id, 'ukuran', e.target.value)} disabled={isSubmitting} className="bg-white" /></div>
                        <div className="grid grid-cols-3 gap-2 col-span-full">
                          <div className="space-y-1"><label className="text-xs font-medium">NIB</label><Input value={p.nib} onChange={(e) => updateProduct(p.id, 'nib', e.target.value)} disabled={isSubmitting} className="bg-white" /></div>
                          <div className="space-y-1"><label className="text-xs font-medium">PIRT</label><Input value={p.pirt} onChange={(e) => updateProduct(p.id, 'pirt', e.target.value)} disabled={isSubmitting} className="bg-white" /></div>
                          <div className="space-y-1"><label className="text-xs font-medium">HALAL</label><Input value={p.halal} onChange={(e) => updateProduct(p.id, 'halal', e.target.value)} disabled={isSubmitting} className="bg-white" /></div>
                        </div>
                        <div className="col-span-full space-y-1"><label className="text-xs font-medium">Catatan Khusus</label><Input value={p.catatan} onChange={(e) => updateProduct(p.id, 'catatan', e.target.value)} disabled={isSubmitting} className="bg-white" /></div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={addProduct} disabled={isSubmitting} className="w-full border-dashed border-2 text-slate-600 cursor-pointer">
                    <PlusCircle size={16} className="mr-2" /> Tambah Produk Lain
                  </Button>
                </div>
              </>
            ) : (
              // 🟡 MODE EDIT: Form Flat 1 Baris
              editFormData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-xs font-semibold">Nama Mitra/UMKM *</label><Input value={editFormData.nama_mitra} onChange={(e) => setEditFormData({...editFormData, nama_mitra: e.target.value.toUpperCase()})} disabled={isSubmitting} required /></div>
                  <div className="space-y-1"><label className="text-xs font-semibold">No Telp/WhatsApp *</label><Input value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} disabled={isSubmitting} required /></div>
                  <div className="col-span-full space-y-1 mt-2"><label className="text-xs font-semibold">Nama Produk *</label><Input value={editFormData.nama_produk} onChange={(e) => setEditFormData({...editFormData, nama_produk: e.target.value.toUpperCase()})} disabled={isSubmitting} required /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Merek</label><Input value={editFormData.merek} onChange={(e) => setEditFormData({...editFormData, merek: e.target.value.toUpperCase()})} disabled={isSubmitting} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Label/Varian</label><Input value={editFormData.label} onChange={(e) => setEditFormData({...editFormData, label: e.target.value.toUpperCase()})} disabled={isSubmitting} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Jenis Kemasan</label><Input value={editFormData.jenis_kemasan} onChange={(e) => setEditFormData({...editFormData, jenis_kemasan: e.target.value.toUpperCase()})} disabled={isSubmitting} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Ukuran</label><Input value={editFormData.ukuran} onChange={(e) => setEditFormData({...editFormData, ukuran: e.target.value.toUpperCase()})} disabled={isSubmitting} /></div>
                  <div className="grid grid-cols-3 gap-2 col-span-full">
                    <div className="space-y-1"><label className="text-xs font-medium">NIB</label><Input value={editFormData.nib} onChange={(e) => setEditFormData({...editFormData, nib: e.target.value.toUpperCase()})} disabled={isSubmitting} /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">PIRT</label><Input value={editFormData.pirt} onChange={(e) => setEditFormData({...editFormData, pirt: e.target.value.toUpperCase()})} disabled={isSubmitting} /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">HALAL</label><Input value={editFormData.halal} onChange={(e) => setEditFormData({...editFormData, halal: e.target.value.toUpperCase()})} disabled={isSubmitting} /></div>
                  </div>
                  <div className="col-span-full space-y-1"><label className="text-xs font-medium">Catatan Khusus</label><Input value={editFormData.catatan} onChange={(e) => setEditFormData({...editFormData, catatan: e.target.value})} disabled={isSubmitting} /></div>
                </div>
              )
            )}
            <button type="submit" id="submit-btn" className="hidden"></button>
          </form>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="cursor-pointer">Batal</Button>
            <Button onClick={() => document.getElementById('submit-btn').click()} disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Menyimpan</> : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader><DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle><DialogDescription>Yakin ingin menghapus data ini dari sistem?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="cursor-pointer">Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="cursor-pointer">{isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}