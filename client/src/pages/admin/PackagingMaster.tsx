import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Edit, Layers, CheckCircle, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { packagingService } from '@/services/packaging.service';
import { toTitleCase } from '@/utils/formatter';

export default function PackagingMaster() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE FOR TYPES ---
  const [typeForm, setTypeForm] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);

  // --- STATE FOR SIZES ---
  const [isSizeModalOpen, setSizeModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
  
  const [sizeForm, setSizeForm] = useState({ size: '', priceDisplay: '' });

  const fetchData = async () => {
    try {
      const res = await packagingService.getAll();
      setData(res.packagings);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- FORMATTER HELPERS ---

  const formatRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3; // FIX: Gunakan const karena nilainya tidak diubah ulang
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }
    return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  };

  const parseRupiah = (formatted: string) => {
    return Number(formatted.replace(/[^0-9,-]+/g, ''));
  };

  // --- HANDLERS TYPE ---

  const handleTypeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypeForm(toTitleCase(e.target.value));
  };

  const handleEditType = (type: any) => {
    setEditingTypeId(type.id);
    setTypeForm(type.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditType = () => {
    setEditingTypeId(null);
    setTypeForm('');
  };

  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!typeForm.trim()) return;
    
    try {
      if (editingTypeId) {
        await packagingService.updateType(editingTypeId, { name: typeForm });
        Swal.fire('Sukses', 'Jenis kemasan diperbarui', 'success');
      } else {
        await packagingService.createType({ name: typeForm });
        Swal.fire('Sukses', 'Jenis kemasan ditambahkan', 'success');
      }
      cancelEditType();
      fetchData();
    } catch { Swal.fire('Gagal', 'Terjadi kesalahan', 'error'); }
  };

  const handleDeleteType = (id: number) => {
    Swal.fire({
      title: 'Hapus Jenis Kemasan?', text: 'Semua ukuran di dalamnya juga akan terhapus!',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus'
    }).then(async (res) => {
      if(res.isConfirmed) {
        await packagingService.deleteType(id);
        fetchData();
      }
    });
  };

  // --- HANDLERS SIZE ---

  const openSizeModal = (type: any, sizeToEdit?: any) => {
    setSelectedType(type);
    if (sizeToEdit) {
      setEditingSizeId(sizeToEdit.id);
      setSizeForm({
        size: sizeToEdit.size,
        priceDisplay: sizeToEdit.price ? formatRupiah(sizeToEdit.price.toString()) : ''
      });
    } else {
      setEditingSizeId(null);
      setSizeForm({ size: '', priceDisplay: '' });
    }
    setSizeModalOpen(true);
  };

  const handleSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'size') {
      setSizeForm(prev => ({ ...prev, size: toTitleCase(value) }));
    } else if (name === 'price') {
      setSizeForm(prev => ({ ...prev, priceDisplay: formatRupiah(value) }));
    }
  };

  const handleSubmitSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!sizeForm.size.trim()) return;

    const payloadPrice = parseRupiah(sizeForm.priceDisplay);

    try {
      if (editingSizeId) {
         await packagingService.updateSize(editingSizeId, {
            size: sizeForm.size,
            price: payloadPrice
         });
         Swal.fire('Sukses', 'Ukuran diperbarui', 'success');
      } else {
         await packagingService.createSize({ 
            type_id: selectedType.id, 
            size: sizeForm.size, 
            price: payloadPrice 
         });
         Swal.fire('Sukses', 'Ukuran ditambahkan', 'success');
      }
      setSizeModalOpen(false);
      fetchData();
    } catch { Swal.fire('Gagal', 'Error', 'error'); }
  };

  const handleDeleteSize = async (id: number) => {
     await packagingService.deleteSize(id);
     fetchData();
  };

  // FIX: Menggunakan variabel loading untuk menampilkan loader
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Harga & Kemasan</h1>
          <p className="text-slate-500 text-sm">Kelola jenis kemasan, ukuran, dan standar harga.</p>
        </div>
      </div>

      {/* FORM TYPE */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
            {editingTypeId ? 'Edit Jenis Kemasan' : 'Tambah Jenis Kemasan Baru'}
        </label>
        <div className="flex gap-2">
            <input 
              value={typeForm} 
              onChange={handleTypeInputChange} 
              placeholder="Contoh: Standing Pouch" 
              className="flex-1 p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            {editingTypeId ? (
                <>
                    <button onClick={cancelEditType} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200">
                        Batal
                    </button>
                    <button onClick={handleSubmitType} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2">
                        <CheckCircle size={18} /> Simpan
                    </button>
                </>
            ) : (
                <button onClick={handleSubmitType} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={18} /> Tambah
                </button>
            )}
        </div>
      </div>

      {/* LIST PACKAGINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map((type) => (
          <div key={type.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${editingTypeId === type.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <Package className="text-blue-600" size={20} />
                {type.name}
              </div>
              <div className="flex gap-2">
                 <button onClick={() => openSizeModal(type)} className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-bold flex items-center gap-1">
                    <Plus size={14}/> Ukuran
                 </button>
                 <button onClick={() => handleEditType(type)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50">
                    <Edit size={16} />
                 </button>
                 <button onClick={() => handleDeleteType(type.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                 </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {type.sizes.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">Belum ada ukuran</div>
              ) : (
                type.sizes.map((s: any) => (
                  <div key={s.id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Layers size={16} className="text-slate-300" />
                      <div>
                        <p className="text-sm font-bold text-slate-700">{s.size}</p>
                        <p className="text-xs text-slate-500">Ref Harga: Rp {s.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => openSizeModal(type, s)} className="text-slate-300 hover:text-blue-500 p-1"><Edit size={14}/></button>
                        <button onClick={() => handleDeleteSize(s.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ADD/EDIT SIZE */}
      {isSizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg">{editingSizeId ? 'Edit Ukuran' : 'Tambah Ukuran'}</h3>
                    <p className="text-xs text-slate-500">Untuk: <span className="font-bold text-blue-600">{selectedType?.name}</span></p>
                </div>
                <button onClick={() => setSizeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmitSize} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Ukuran</label>
                <input required name="size" placeholder="Cth: 14x22 cm" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={sizeForm.size} onChange={handleSizeInputChange} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Harga Dasar (Ref)</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">Rp</span>
                    <input name="price" type="text" placeholder="0" className="w-full pl-9 p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        value={sizeForm.priceDisplay} onChange={handleSizeInputChange} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSizeModalOpen(false)} className="flex-1 py-2 text-slate-500 font-bold bg-slate-100 rounded-lg hover:bg-slate-200">Batal</button>
                <button type="submit" className="flex-1 py-2 text-white font-bold bg-blue-600 rounded-lg hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}