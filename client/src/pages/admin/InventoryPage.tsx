import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, RefreshCcw, Search, ClipboardList, Box, Loader2, 
  ChevronRight, X, CheckCircle, ArrowRightLeft, Undo 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { inventoryService } from '@/services/inventory.service';

export default function InventoryPage() {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'stocks' | 'mutation' | 'logs'>('stocks');
  const [stocks, setStocks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // --- STATE KHUSUS FORM MUTASI ---
  const [form, setForm] = useState({
    item_id: '',
    type: 'in', 
    quantity: '', 
    note: ''
  });

  // State untuk Modal Pencarian Bahan Baku
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'stocks' || activeTab === 'mutation') {
        const res = await inventoryService.getStocks();
        setStocks(res.stocks);
      }
      if (activeTab === 'logs') {
        const res = await inventoryService.getLogs();
        setLogs(res.logs);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }, [activeTab]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // FUNGSI SIMPAN MUTASI MANUAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.item_id || qty <= 0) return Swal.fire('Error', 'Data tidak valid', 'error');

    try {
      await inventoryService.updateStock({
        item_id: Number(form.item_id),
        type: form.type as any,
        quantity: qty,
        note: form.note
      });
      Swal.fire({
         icon: 'success',
         title: 'Berhasil',
         text: 'Stok berhasil diperbarui',
         timer: 1500,
         showConfirmButton: false
      });
      setForm({ item_id: '', type: 'in', quantity: '', note: '' });
      fetchData();
    } catch (e) { 
      console.error(e);
      Swal.fire('Gagal', 'Error server', 'error'); 
    }
  };

  // FUNGSI BATALKAN OPNAME (UNDO)
  const handleUndoOpname = async (logId: number, itemName: string) => {
    const confirm = await Swal.fire({
        title: 'Batalkan Opname?',
        html: `Anda akan membatalkan opname untuk <b>${itemName}</b> dan mengembalikan stok ke angka sebelumnya.<br/><br/><span class="text-red-500 text-xs">Peringatan: Lakukan ini hanya jika belum ada pemakaian bahan setelah opname tersebut!</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Batalkan',
        confirmButtonColor: '#ef4444'
    });

    if (!confirm.isConfirmed) return;

    try {
        Swal.fire({ title: 'Membatalkan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await inventoryService.undoOpname(logId);
        Swal.fire('Berhasil', 'Stok dikembalikan ke angka sebelumnya.', 'success');
        fetchData(); // Refresh data untuk update tampilan log & stok
    } catch (e: any) {
        Swal.fire('Gagal', e.response?.data?.message || 'Gagal membatalkan opname. Pastikan Anda memiliki akses Admin.', 'error');
    }
  };

  const filteredStocks = useMemo(() => {
    return stocks.filter(s => 
        s.material_name.toLowerCase().includes(globalSearch.toLowerCase()) || 
        s.item_name.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [stocks, globalSearch]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return stocks;
    return stocks.filter(s => 
        s.material_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stocks, searchQuery]);

  const selectedItemLabel = useMemo(() => {
     if(!form.item_id) return null;
     const item = stocks.find(s => s.id === Number(form.item_id));
     return item ? `${item.material_name} - ${item.item_name}` : null;
  }, [form.item_id, stocks]);

  const selectedItemStock = useMemo(() => {
    if(!form.item_id) return null;
    const item = stocks.find(s => s.id === Number(form.item_id));
    return item ? `${item.stock} ${item.unit}` : '';
 }, [form.item_id, stocks]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Gudang Bahan</h1>
          <div className="flex gap-2">
              {/* Tombol ke Halaman Opname Fokus */}
              <button 
                 onClick={() => navigate('/inventory/opname')} 
                 className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 flex items-center gap-1"
              >
                 <CheckCircle size={14}/> Sesi Opname
              </button>
              <button onClick={fetchData} className="p-2 bg-slate-100 rounded-full text-blue-600 active:scale-95"><RefreshCcw size={18}/></button>
          </div>
      </div>
      
      {/* Tabs Navigasi Mobile-Friendly */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <button onClick={() => setActiveTab('stocks')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'stocks' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>
            <Box size={16}/> Stok
        </button>
        <button onClick={() => setActiveTab('mutation')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'mutation' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>
            <ArrowRightLeft size={16}/> Mutasi
        </button>
        <button onClick={() => setActiveTab('logs')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'logs' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>
            <History size={16}/> Riwayat
        </button>
      </div>

      {/* === CONTENT: STOK === */}
      {activeTab === 'stocks' && (
        <div className="space-y-3">
           <div className="relative">
             <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
             <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                placeholder="Cari nama bahan..." 
                value={globalSearch} 
                onChange={e => setGlobalSearch(e.target.value)}
             />
           </div>

           {loading ? <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></div> : 
            <div className="grid gap-3">
                {filteredStocks.map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-700">{s.material_name}</h3>
                            <p className="text-sm text-slate-500">{s.item_name}</p>
                        </div>
                        <div className="text-right">
                            <span className={`block text-lg font-black ${s.stock < 10 ? 'text-red-500' : 'text-blue-600'}`}>
                                {s.stock}
                            </span>
                            <span className="text-xs text-slate-400 font-bold uppercase">{s.unit}</span>
                        </div>
                    </div>
                ))}
            </div>
           }
        </div>
      )}

      {/* === CONTENT: FORM MUTASI (HANYA IN & OUT) === */}
      {activeTab === 'mutation' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
           <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
               <ClipboardList className="text-blue-600"/> Catat Mutasi
           </h3>
           
           <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Bahan Baku</label>
                 <button 
                    type="button"
                    onClick={() => { setShowSearchModal(true); setSearchQuery(''); }}
                    className={`w-full p-4 rounded-xl border flex justify-between items-center text-left transition-all ${form.item_id ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                 >
                    <div className="overflow-hidden">
                        <span className="block font-bold text-sm truncate">{selectedItemLabel || "Cari Bahan Baku..."}</span>
                        {selectedItemStock && <span className="text-xs opacity-70">Stok saat ini: {selectedItemStock}</span>}
                    </div>
                    <ChevronRight size={18} className="shrink-0 opacity-50"/>
                 </button>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tipe Mutasi</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setForm({...form, type: 'in'})} className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${form.type === 'in' ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200' : 'bg-white border-slate-200 text-slate-500'}`}>
                        Masuk (Restock)
                    </button>
                    <button type="button" onClick={() => setForm({...form, type: 'out'})} className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${form.type === 'out' ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' : 'bg-white border-slate-200 text-slate-500'}`}>
                        Keluar (Pemakaian)
                    </button>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                    Jumlah Mutasi
                 </label>
                 <input 
                    type="number" 
                    inputMode="numeric"
                    required 
                    placeholder="0"
                    className="w-full p-4 border border-slate-200 rounded-xl text-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300" 
                    value={form.quantity} 
                    onChange={e => setForm({...form, quantity: e.target.value})}
                 />
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Keterangan</label>
                 <textarea 
                    placeholder="Contoh: Pembelian baru, Barang rusak, dll..." 
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-20 text-sm" 
                    value={form.note} 
                    onChange={e => setForm({...form, note: e.target.value})}
                 ></textarea>
              </div>

              <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-xl">
                  Simpan Transaksi
              </button>
           </form>
        </div>
      )}

      {/* === CONTENT: LOGS DENGAN TOMBOL UNDO === */}
      {activeTab === 'logs' && (
         <div className="space-y-3">
             {loading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div> : logs.map((l, i) => (
                 <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm relative">
                    
                    {/* TOMBOL UNDO (Hanya muncul jika tipe 'opname') */}
                    {l.type === 'opname' && (
                        <button 
                           onClick={() => handleUndoOpname(l.id, l.material_name)} 
                           className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-1 text-[10px] font-bold transition-all active:scale-95"
                           title="Batalkan Opname Ini"
                        >
                            <Undo size={12}/> BATAL (UNDO)
                        </button>
                    )}

                    <div className="flex justify-between items-start mb-2 pr-24">
                        <div>
                            <span className="font-bold text-slate-800 block">{l.material_name}</span>
                            <span className="text-xs text-slate-500">{l.item_name}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-slate-50 pt-2 mt-2">
                        <div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold mr-2 inline-block ${l.type === 'in' ? 'bg-green-100 text-green-700' : l.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {l.type === 'in' ? 'Masuk' : l.type === 'out' ? 'Keluar' : 'Opname'}
                            </span>
                            <span className={`text-lg font-bold ${l.quantity > 0 ? 'text-green-600' : l.quantity < 0 ? 'text-red-500' : 'text-slate-600'}`}>
                                {l.quantity > 0 ? '+' : ''}{l.quantity}
                            </span>
                        </div>
                        <div className="text-right">
                             <span className="text-[10px] text-slate-400 block">{new Date(l.created_at).toLocaleDateString()}</span>
                             <span className="text-xs text-slate-500 italic truncate max-w-37.5 block">{l.note}</span>
                        </div>
                    </div>
                 </div>
             ))}
         </div>
      )}

      {/* === MODAL PENCARIAN BAHAN BAKU === */}
      {showSearchModal && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-200">
              <div className="p-4 border-b border-slate-100 flex gap-3 items-center bg-white shadow-sm shrink-0">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                      <input 
                        autoFocus
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="Cari nama bahan..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                  </div>
                  <button onClick={() => setShowSearchModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                      <X size={20}/>
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
                  {searchResults.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                          <p>Bahan baku tidak ditemukan.</p>
                      </div>
                  ) : (
                      searchResults.map(s => (
                          <button 
                            key={s.id}
                            onClick={() => {
                                setForm({...form, item_id: String(s.id)});
                                setShowSearchModal(false);
                            }}
                            className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-blue-500 active:bg-blue-50 text-left group"
                          >
                              <div>
                                  <h4 className="font-bold text-slate-800 group-hover:text-blue-700">{s.material_name}</h4>
                                  <p className="text-sm text-slate-500">{s.item_name}</p>
                              </div>
                              <div className="text-right">
                                  <span className="block text-sm font-bold text-slate-700">{s.stock}</span>
                                  <span className="text-[10px] uppercase text-slate-400">{s.unit}</span>
                              </div>
                              {form.item_id === String(s.id) && <CheckCircle className="text-blue-600 ml-2" size={18}/>}
                          </button>
                      ))
                  )}
              </div>
          </div>
      )}
    </div>
  );
}