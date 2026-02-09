import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  History, RefreshCcw, Search, ClipboardList, Box, Loader2, 
  ChevronRight, X, CheckCircle, ArrowRightLeft 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { inventoryService } from '@/services/inventory.service';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'stocks' | 'mutation' | 'logs'>('stocks');
  const [stocks, setStocks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // --- STATE KHUSUS FORM MUTASI ---
  const [form, setForm] = useState({
    item_id: '',
    type: 'in', 
    quantity: '', // Ganti ke string dulu biar enak saat hapus angka 0
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
      // Reset Form
      setForm({ item_id: '', type: 'in', quantity: '', note: '' });
      fetchData();
    } catch { Swal.fire('Gagal', 'Error server', 'error'); }
  };

  // Filter untuk Tab STOK
  const filteredStocks = useMemo(() => {
    return stocks.filter(s => 
        s.material_name.toLowerCase().includes(globalSearch.toLowerCase()) || 
        s.item_name.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [stocks, globalSearch]);

  // Filter untuk Modal Pencarian (Form Mutasi)
  const searchResults = useMemo(() => {
    if (!searchQuery) return stocks;
    return stocks.filter(s => 
        s.material_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stocks, searchQuery]);

  // Helper untuk mendapatkan nama item yang dipilih
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
          {/* Tombol Refresh kecil */}
          <button onClick={fetchData} className="p-2 bg-slate-100 rounded-full text-blue-600 active:scale-95"><RefreshCcw size={18}/></button>
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
           {/* Search Bar */}
           <div className="relative">
             <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
             <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                placeholder="Cari nama bahan..." 
                value={globalSearch} 
                onChange={e => setGlobalSearch(e.target.value)}
             />
           </div>

           {/* List Card Stok (Lebih enak di mobile daripada Table) */}
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

      {/* === CONTENT: FORM MUTASI (MOBILE OPTIMIZED) === */}
      {activeTab === 'mutation' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
           <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
               <ClipboardList className="text-blue-600"/> Catat Mutasi
           </h3>
           
           <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* 1. PEMILIHAN BARANG (SEARCHABLE MODAL TRIGGER) */}
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

              {/* 2. JENIS TRANSAKSI (BIG BUTTONS) */}
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tipe Mutasi</label>
                 <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setForm({...form, type: 'in'})} className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${form.type === 'in' ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200' : 'bg-white border-slate-200 text-slate-500'}`}>
                        Masuk
                    </button>
                    <button type="button" onClick={() => setForm({...form, type: 'out'})} className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${form.type === 'out' ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' : 'bg-white border-slate-200 text-slate-500'}`}>
                        Keluar
                    </button>
                    <button type="button" onClick={() => setForm({...form, type: 'opname'})} className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${form.type === 'opname' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white border-slate-200 text-slate-500'}`}>
                        Opname
                    </button>
                 </div>
              </div>

              {/* 3. INPUT JUMLAH */}
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                    {form.type === 'opname' ? 'Stok Fisik (Real)' : 'Jumlah Mutasi'}
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

              {/* 4. CATATAN */}
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

      {/* === CONTENT: LOGS === */}
      {activeTab === 'logs' && (
         <div className="space-y-3">
             {loading ? <Loader2 className="animate-spin mx-auto"/> : logs.map((l, i) => (
                 <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="font-bold text-slate-800 block">{l.material_name}</span>
                            <span className="text-xs text-slate-500">{l.item_name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${l.type === 'in' ? 'bg-green-100 text-green-700' : l.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {l.type === 'in' ? 'Masuk' : l.type === 'out' ? 'Keluar' : 'Opname'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 pt-2 mt-2">
                        <span className={`text-lg font-bold ${l.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {l.quantity > 0 ? '+' : ''}{l.quantity}
                        </span>
                        <div className="text-right">
                             <span className="text-[10px] text-slate-400 block">{new Date(l.created_at).toLocaleDateString()}</span>
                             <span className="text-xs text-slate-500 italic truncate max-w-37.5 block">{l.note}</span>
                        </div>
                    </div>
                 </div>
             ))}
         </div>
      )}

      {/* === MODAL PENCARIAN (FULLSCREEN ON MOBILE) === */}
      {showSearchModal && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-200">
              {/* Header Modal */}
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

              {/* List Hasil Pencarian */}
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
                                setForm({...form, item_id: String(s.id)}); // Set ID
                                setShowSearchModal(false); // Tutup Modal
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