import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, RefreshCw, Users, ArrowLeft } from 'lucide-react';

export default function DataMitra() {
  const navigate = useNavigate();
  const [mitras, setMitras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // State Form Dinamis
  const initialForm = { id: '', nama_mitra: '', phone: '', nama_produk: '', label: '', merek: '', jenis_kemasan: '', ukuran: '', nib: '', pirt: '', halal: '', catatan: '' };
  const [formData, setFormData] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  const fetchMitra = async () => {
    const res = await fetch('/api/mitra');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error);
    return result.data.mitra;
  };

  useEffect(() => {
    fetchMitra().then(setMitras).catch(err => toast.error(err.message)).finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchMitra().then(setMitras).catch(err => toast.error(err.message)).finally(() => setIsLoading(false));
  };

  const handleInputChange = (e) => {
    // Semua input otomatis UPPERCASE sesuai request lu sebelumnya
    setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() });
  };

  const openAddForm = () => {
    setIsEdit(false);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setIsEdit(true);
    setFormData(item);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_mitra || !formData.phone || !formData.nama_produk) {
      return toast.warning("Nama Mitra, No WA, dan Nama Produk wajib diisi");
    }

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/mitra/${formData.id}` : '/api/mitra';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      const result = await res.json();

      if (res.ok && result.ok) {
        toast.success(result.data.message);
        setIsFormOpen(false);
        handleRefresh();
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
        handleRefresh();
      } else {
        toast.error("Gagal menghapus data", { description: result.error });
      }
    } catch (err) {
      console.error(err);
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
          
          {/* --- TOMBOL KEMBALI --- */}
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2 border-slate-300 text-slate-600 hover:bg-slate-100">
            <ArrowLeft size={16} /> Kembali
          </Button>

          {/* Tombol yang sudah ada sebelumnya */}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin':''}`} /> Refresh
          </Button>
          <Button onClick={openAddForm} className="gap-2">
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
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : mitras.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Belum ada data mitra.</TableCell></TableRow>
                ) : (
                  mitras.map((m) => (
                    <TableRow key={m.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-700">{m.nama_mitra}</TableCell>
                      <TableCell>{m.phone}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-primary">{m.nama_produk}</div>
                        <div className="text-xs text-slate-500">{m.merek} - {m.label}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{m.jenis_kemasan}</div>
                        <div className="text-xs text-slate-500">{m.ukuran}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[10px] space-y-0.5">
                          {m.nib && <div><span className="font-semibold">NIB:</span> {m.nib}</div>}
                          {m.pirt && <div><span className="font-semibold">PIRT:</span> {m.pirt}</div>}
                          {m.halal && <div><span className="font-semibold">HALAL:</span> {m.halal}</div>}
                          {!m.nib && !m.pirt && !m.halal && <span className="text-slate-400">Tidak ada</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditForm(m)}><Edit size={16} className="text-blue-600"/></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)}><Trash2 size={16} className="text-red-600"/></Button>
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
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Data Mitra' : 'Pendaftaran Mitra Baru'}</DialogTitle>
            <DialogDescription>Masukkan spesifikasi produk kemasan klien ke dalam sistem.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-xs font-semibold">Nama Mitra/UMKM *</label><Input name="nama_mitra" value={formData.nama_mitra} onChange={handleInputChange} disabled={isSubmitting} required /></div>
              <div className="space-y-1"><label className="text-xs font-semibold">No Telp/WA *</label><Input name="phone" type="number" value={formData.phone} onChange={handleInputChange} disabled={isSubmitting} required /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-1"><label className="text-xs font-semibold">Nama Produk *</label><Input name="nama_produk" value={formData.nama_produk} onChange={handleInputChange} disabled={isSubmitting} required placeholder="KRIPIK PISANG"/></div>
              <div className="space-y-1"><label className="text-xs font-semibold">Merek</label><Input name="merek" value={formData.merek} onChange={handleInputChange} disabled={isSubmitting} placeholder="PISANGKU"/></div>
              <div className="space-y-1"><label className="text-xs font-semibold">Label/Varian</label><Input name="label" value={formData.label} onChange={handleInputChange} disabled={isSubmitting} placeholder="RASA COKELAT"/></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-xs font-semibold">Jenis Kemasan</label><Input name="jenis_kemasan" value={formData.jenis_kemasan} onChange={handleInputChange} disabled={isSubmitting} placeholder="STANDING POUCH"/></div>
              <div className="space-y-1"><label className="text-xs font-semibold">Ukuran (PxLxT / Gramasi)</label><Input name="ukuran" value={formData.ukuran} onChange={handleInputChange} disabled={isSubmitting} placeholder="12x20 CM / 100gr"/></div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">No NIB</label><Input name="nib" value={formData.nib} onChange={handleInputChange} disabled={isSubmitting} className="bg-white" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">No PIRT</label><Input name="pirt" value={formData.pirt} onChange={handleInputChange} disabled={isSubmitting} className="bg-white" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">No Sertifikat HALAL</label><Input name="halal" value={formData.halal} onChange={handleInputChange} disabled={isSubmitting} className="bg-white" /></div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Catatan (Komposisi Kandungan Gizi, Warna, dll)</label>
              <Input name="catatan" value={formData.catatan} onChange={(e) => setFormData({...formData, catatan: e.target.value})} disabled={isSubmitting} placeholder="Gula 20%, Garam 1%... Desain minta warna dominan kuning."/>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Simpan Data'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirm Delete */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
            <DialogDescription>Yakin ingin menghapus data katalog produk mitra ini dari sistem?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}