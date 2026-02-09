import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Package, ChevronRight, Edit, Save, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { materialService } from '@/services/material.service';

// Helper Formatter: Title Case
const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

export default function MaterialMaster() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PARENT (MATERIAL) ---
  const [parentForm, setParentForm] = useState('');
  const [editingParentId, setEditingParentId] = useState<number | null>(null);

  // --- STATE CHILD (ITEM) ---
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [itemForm, setItemForm] = useState({ name: '', unit: 'pcs' });
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // Fetch Data (Stabil dengan useCallback)
  const fetchData = useCallback(async () => {
    try {
      const res = await materialService.getAll();
      setData(res.materials);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS PARENT ---

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentForm.trim()) return;

    try {
      if (editingParentId) {
        await materialService.updateMaterial(editingParentId, { name: parentForm });
        Swal.fire('Sukses', 'Nama bahan baku diperbarui', 'success');
        setEditingParentId(null);
      } else {
        await materialService.createMaterial({ name: parentForm });
        Swal.fire('Sukses', 'Bahan baku ditambahkan', 'success');
      }
      setParentForm('');
      fetchData();
    } catch { Swal.fire('Gagal', 'Terjadi kesalahan', 'error'); }
  };

  const handleEditParent = (mat: any) => {
    setEditingParentId(mat.id);
    setParentForm(mat.name);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke form atas
  };

  const handleCancelParent = () => {
    setEditingParentId(null);
    setParentForm('');
  };

  const handleDeleteParent = (id: number) => {
    Swal.fire({
      title: 'Hapus Bahan Baku?',
      text: "Semua varian di dalamnya juga akan terhapus!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await materialService.deleteMaterial(id);
        fetchData();
      }
    });
  };

  // --- HANDLERS CHILD ---

  const openItemModal = (parent: any, itemToEdit?: any) => {
    setSelectedParent(parent);
    if (itemToEdit) {
      setEditingItemId(itemToEdit.id);
      setItemForm({ name: itemToEdit.name, unit: itemToEdit.unit });
    } else {
      setEditingItemId(null);
      setItemForm({ name: '', unit: 'pcs' });
    }
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name) return;

    try {
      if (editingItemId) {
        await materialService.updateItem(editingItemId, itemForm);
        Swal.fire('Sukses', 'Varian diperbarui', 'success');
      } else {
        await materialService.createItem({
          material_id: selectedParent.id,
          name: itemForm.name,
          unit: itemForm.unit
        });
        Swal.fire('Sukses', 'Varian ditambahkan', 'success');
      }
      setShowItemModal(false);
      fetchData();
    } catch { Swal.fire('Gagal', 'Error', 'error'); }
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm('Hapus varian ini?')) {
      await materialService.deleteItem(id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20"> {/* Tambah padding bawah utk mobile */}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Master Bahan Baku</h1>
        <p className="text-xs text-slate-500">Kelola jenis bahan dan varian ukurannya.</p>
      </div>
      
      {/* Form Add/Edit Parent (Responsive Fix) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
            {editingParentId ? 'Edit Nama Bahan Baku' : 'Tambah Bahan Baku Baru'}
         </label>
         <form onSubmit={handleParentSubmit} className="flex flex-col md:flex-row gap-2">
            <input 
                placeholder="Contoh: Tepung Terigu, Plastik PE" 
                className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={parentForm} 
                onChange={e => setParentForm(toTitleCase(e.target.value))} 
            />
            {editingParentId ? (
                <div className="flex gap-2">
                    <button type="button" onClick={handleCancelParent} className="flex-1 md:flex-none py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Batal</button>
                    <button type="submit" className="flex-1 md:flex-none py-3 px-6 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex justify-center items-center gap-2">
                        <Save size={18}/> Simpan
                    </button>
                </div>
            ) : (
                <button type="submit" className="w-full md:w-auto py-3 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex justify-center items-center gap-2 shadow-lg md:shadow-none">
                    <Plus size={18}/> Tambah
                </button>
            )}
         </form>
      </div>

      {/* List Materials */}
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600"/></div> : 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map(mat => (
            <div key={mat.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${editingParentId === mat.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                
                {/* Header Card */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3 font-bold text-slate-800">
                        <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Package size={18}/></div>
                        {mat.name}
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => openItemModal(mat)} className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-50 flex items-center gap-1">
                            <Plus size={14}/> Varian
                        </button>
                        <button onClick={() => handleEditParent(mat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={16}/>
                        </button>
                        <button onClick={() => handleDeleteParent(mat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>

                {/* List Items */}
                <div className="divide-y divide-slate-100">
                    {mat.items.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400 italic bg-white">Belum ada varian ukuran</div>
                    ) : (
                        mat.items.map((item: any) => (
                            <div key={item.id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors bg-white">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <ChevronRight size={16} className="text-slate-300"/> 
                                    <span className="font-medium text-slate-700">{item.name}</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase font-bold">{item.unit}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openItemModal(mat, item)} className="text-slate-300 hover:text-blue-500 transition-colors"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        ))}
       </div>
      }

      {/* Modal Add/Edit Item */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{editingItemId ? 'Edit Varian' : 'Tambah Varian'}</h3>
                        <p className="text-xs text-slate-500">Induk: <span className="font-bold text-blue-600">{selectedParent?.name}</span></p>
                    </div>
                    <button onClick={() => setShowItemModal(false)} className="p-1 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200"><X size={18}/></button>
                </div>
                
                <form onSubmit={handleItemSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Nama Varian / Ukuran</label>
                        <input required placeholder="Contoh: 1 Kg, 14x22 cm, Grade A" 
                            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={itemForm.name} 
                            onChange={e => setItemForm({...itemForm, name: toTitleCase(e.target.value)})} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Satuan Unit</label>
                        <input required placeholder="Contoh: pcs, roll, kg, lembar" 
                            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={itemForm.unit} 
                            onChange={e => setItemForm({...itemForm, unit: e.target.value.toLowerCase()})} 
                        />
                    </div>
                    
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg mt-2 flex justify-center items-center gap-2">
                        {editingItemId ? <Save size={18}/> : <Plus size={18}/>}
                        {editingItemId ? 'Simpan Perubahan' : 'Tambahkan'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}