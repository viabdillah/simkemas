import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Package, Edit, Trash2, RotateCcw, 
  CheckCircle, X, Loader2, Scale, Box 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { productService } from '@/services/product.service';
import { customerService } from '@/services/customer.service';
import { packagingService } from '@/services/packaging.service';
import { toTitleCase } from '@/utils/formatter';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [packagings, setPackagings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', brand: '', variants: '', netto: '', 
    packaging_type: '', packaging_size: '', 
    nib: '', halal: '', pirt: ''
  });

  const [selectedTypeId, setSelectedTypeId] = useState<number | string>(''); 
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      const resProd = await productService.getByCustomer(Number(id), viewMode === 'trash');
      setProducts(resProd.products);

      const resCust = await customerService.getCustomers(id); 
      const found = resCust.customers.find((c: any) => c.id == id);
      if (found) setCustomer(found);

      const resPack = await packagingService.getAll();
      setPackagings(resPack.packagings);

    } catch (e) {
      // FIX: Menangani error block kosong
      console.error("Error fetching detail:", e);
    } finally {
      setLoading(false);
    }
  }, [id, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedTypeId) {
      const type = packagings.find(p => p.id == selectedTypeId);
      if (type) {
        setAvailableSizes(type.sizes);
        setFormData(prev => ({ ...prev, packaging_type: type.name }));
      }
    } else {
      setAvailableSizes([]);
    }
  }, [selectedTypeId, packagings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'packaging_size') {
        setFormData(prev => ({ ...prev, packaging_size: value }));
        return;
    }
    const formattedVal = ['name', 'brand'].includes(name) ? toTitleCase(value) : value;
    setFormData(prev => ({ ...prev, [name]: formattedVal }));
  };

  const openModal = (product?: any) => {
    if (product) {
      setIsEditMode(true);
      setEditId(product.id);
      
      const matchedType = packagings.find(p => p.name === product.packaging_type);
      const typeId = matchedType ? matchedType.id : '';
      
      setSelectedTypeId(typeId);

      setFormData({
        name: product.name, brand: product.brand,
        variants: product.variants.join(', '),
        netto: product.netto, 
        packaging_type: product.packaging_type,
        packaging_size: product.packaging_size,
        nib: product.nib || '', halal: product.halal || '', pirt: product.pirt || ''
      });
    } else {
      setIsEditMode(false);
      setSelectedTypeId(''); 
      setAvailableSizes([]);
      setFormData({ name: '', brand: '', variants: '', netto: '', packaging_type: '', packaging_size: '', nib: '', halal: '', pirt: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    const payload = {
      ...formData,
      variants: formData.variants.split(',').map(s => s.trim()).filter(s => s !== '')
    };

    try {
      if (isEditMode && editId) {
        await productService.updateProduct(editId, payload);
      } else {
        await productService.createProduct(Number(id), payload);
      }
      setShowModal(false);
      fetchData();
      Swal.fire('Sukses', 'Data produk disimpan', 'success');
    } catch {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (prodId: number) => { await productService.deleteProduct(prodId); fetchData(); };
  const handleRestore = async (prodId: number) => { await productService.restoreProduct(prodId); fetchData(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} className="text-slate-600" /></button>
        <div><h1 className="text-2xl font-bold text-slate-800">{customer ? customer.name : 'Loading...'}</h1><p className="text-slate-500 text-sm">{customer?.code} | Database Produk</p></div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button onClick={() => setViewMode('active')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'active' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Produk Aktif</button>
           <button onClick={() => setViewMode('trash')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'trash' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}>Sampah</button>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"><Plus size={18} /> Tambah Produk</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" /></div> : 
       products.length === 0 ? <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl"><Package size={48} className="mx-auto mb-2 opacity-50" /><p>Belum ada produk.</p></div> :
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-3">
                <div><span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{prod.code}</span><h3 className="font-bold text-lg text-slate-800 mt-1">{prod.name}</h3><p className="text-sm text-blue-600 font-medium">{prod.brand}</p></div>
                <div className="flex gap-1">
                   {viewMode === 'active' ? ( <> <button onClick={() => openModal(prod)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button><button onClick={() => handleDelete(prod.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button> </> ) : ( <button onClick={() => handleRestore(prod.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><RotateCcw size={16} /></button> )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">{prod.variants.map((v: string, i: number) => (<span key={i} className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-md text-xs">{v}</span>))}</div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                 <div className="flex items-center gap-2"><Scale size={14} /> {prod.netto}</div>
                 <div className="flex items-center gap-2"><Box size={14} /> {prod.packaging_type} ({prod.packaging_size})</div>
              </div>
            </div>
          ))}
       </div>
      }

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] relative">
             <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Package className="text-blue-600" /> {isEditMode ? 'Edit Produk' : 'Produk Baru'}</h2>
               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
             </div>

             <div className="p-6 overflow-y-auto">
                <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Nama Produk</label>
                          <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Keripik Pisang" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Merk / Brand</label>
                          <input required name="brand" value={formData.brand} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Maknyus" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Varian Rasa</label>
                      <input required name="variants" value={formData.variants} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Coklat, Keju, Balado" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Netto</label>
                          <input required name="netto" value={formData.netto} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="100gr" />
                      </div>
                      
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Jenis Kemasan</label>
                          <select 
                            required 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedTypeId}
                            onChange={(e) => setSelectedTypeId(e.target.value)}
                          >
                            <option value="">-- Pilih Jenis --</option>
                            {packagings.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Ukuran</label>
                          <select 
                            required 
                            name="packaging_size"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-200 disabled:text-slate-400"
                            value={formData.packaging_size}
                            onChange={handleInputChange}
                            disabled={!selectedTypeId || availableSizes.length === 0}
                          >
                            <option value="">-- Pilih Ukuran --</option>
                            {availableSizes.map(s => (
                                <option key={s.id} value={s.size}>{s.size}</option>
                            ))}
                          </select>
                          {selectedTypeId && availableSizes.length === 0 && (
                              <p className="text-[10px] text-red-500 italic">Belum ada ukuran untuk jenis ini.</p>
                          )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">PIRT</label><input name="pirt" value={formData.pirt} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="No PIRT..." /></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">HALAL</label><input name="halal" value={formData.halal} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="No Halal..." /></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">NIB</label><input name="nib" value={formData.nib} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="No NIB..." /></div>
                    </div>
                </form>
             </div>

             <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl shrink-0 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-white border border-transparent hover:border-slate-200 rounded-xl">Batal</button>
                <button disabled={formLoading} onClick={() => document.getElementById('productForm')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex justify-center items-center gap-2">
                   {formLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Simpan Produk</>}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}