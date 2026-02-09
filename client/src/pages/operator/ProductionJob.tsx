import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Printer, CheckCircle, Clock, Play, 
  Loader2, User, X, Plus, Trash2, Search, ChevronRight, ClipboardCheck 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { productionService } from '@/services/production.service';
import { materialService } from '@/services/material.service'; 

export default function ProductionJob() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ready' | 'in_progress'>('ready');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // --- STATE MODAL UTAMA ---
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [targetAction, setTargetAction] = useState<{ id: number, status: string, targetQty: number } | null>(null);
  
  // Data Bahan Baku
  const [materialsList, setMaterialsList] = useState<any[]>([]); 
  
  // Form Input Bahan (Array)
  const [usageForm, setUsageForm] = useState([{ tempId: Date.now(), itemId: '', itemName: '', quantity: '', unit: '' }]);

  // Form QC (Quality Control)
  const [qcQty, setQcQty] = useState<string>('');

  // --- STATE MODAL PENCARIAN ---
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productionService.getQueue();
      setOrders(res.orders);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, []);

  const fetchMaterials = useCallback(async () => {
    try {
        const res = await materialService.getAll();
        setMaterialsList(res.materials);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { 
      fetchQueue(); 
      fetchMaterials(); 
  }, [fetchQueue, fetchMaterials]);

  // FIX ESLINT: Use const
  const searchableMaterials = useMemo(() => {
    const list: any[] = []; 
    materialsList.forEach(parent => {
        parent.items.forEach((item: any) => {
            list.push({
                id: item.id,
                fullName: `${parent.name} - ${item.name}`,
                stock: item.stock,
                unit: item.unit
            });
        });
    });
    return list;
  }, [materialsList]);

  const searchResults = useMemo(() => {
      if (!searchQuery) return searchableMaterials;
      return searchableMaterials.filter(m => 
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [searchQuery, searchableMaterials]);

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'ready') return o.production_status === 'ready_to_print';
    if (activeTab === 'in_progress') return o.production_status === 'in_production';
    return false;
  });

  // --- LOGIC FORM ---

  const promptMaterialUsage = (id: number, nextStatus: string, itemsInOrder: any[]) => {
    // Hitung total target qty dari order (jika item > 1, ambil yg pertama atau total, disini asumsi item utama)
    const totalQty = itemsInOrder.reduce((acc, curr) => acc + curr.quantity, 0);

    setTargetAction({ id, status: nextStatus, targetQty: totalQty });
    
    // Reset form bahan
    setUsageForm([{ tempId: Date.now(), itemId: '', itemName: '', quantity: '', unit: '' }]); 
    
    // Set default QC Qty sama dengan Target Qty
    setQcQty(String(totalQty));

    setShowMaterialModal(true);
  };

  const addRow = () => {
    setUsageForm([...usageForm, { tempId: Date.now(), itemId: '', itemName: '', quantity: '', unit: '' }]);
  };

  const removeRow = (index: number) => {
    const newForm = [...usageForm];
    newForm.splice(index, 1);
    setUsageForm(newForm);
  };

  const selectMaterial = (item: any) => {
    if (activeRowIndex === null) return;
    const newForm = [...usageForm];
    newForm[activeRowIndex].itemId = item.id;
    newForm[activeRowIndex].itemName = item.fullName;
    newForm[activeRowIndex].unit = item.unit;
    
    setUsageForm(newForm);
    setShowSearchModal(false);
    setSearchQuery('');
  };

  const updateQuantity = (index: number, val: string) => {
    const newForm = [...usageForm];
    newForm[index].quantity = val;
    setUsageForm(newForm);
  };

  const confirmAction = async () => {
    if (!targetAction) return;

    // Filter bahan yang valid (jika ada input)
    const validMaterials = usageForm
        .filter(row => row.itemId && Number(row.quantity) > 0)
        .map(row => ({ item_id: row.itemId, quantity: Number(row.quantity) }));

    try {
        await productionService.updateStatus(
            targetAction.id, 
            targetAction.status, 
            '', 
            validMaterials, 
            targetAction.status === 'completed' ? Number(qcQty) : 0 // Kirim QC hanya saat selesai
        );
        setShowMaterialModal(false);
        setTargetAction(null);
        fetchQueue();
        
        Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: targetAction.status === 'in_production' ? 'Produksi dimulai' : 'Produksi selesai & QC tercatat',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (e) {
        console.error(e);
        Swal.fire('Gagal', 'Terjadi kesalahan sistem', 'error');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-xl font-bold text-slate-800">Operator Produksi</h1>
           <p className="text-slate-500 text-xs">Kelola antrian cetak.</p>
        </div>
        <button onClick={fetchQueue} className="p-2 bg-slate-100 rounded-full text-blue-600 active:scale-95"><Printer size={18}/></button>
      </div>

      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
        <button onClick={() => setActiveTab('ready')} className={`flex-1 py-3 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'ready' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}>
            <Printer size={16}/> Siap Cetak
            {orders.filter(o => o.production_status === 'ready_to_print').length > 0 && 
                <span className="bg-white text-blue-600 text-[10px] px-1.5 rounded-full shadow-sm">{orders.filter(o => o.production_status === 'ready_to_print').length}</span>
            }
        </button>
        <button onClick={() => setActiveTab('in_progress')} className={`flex-1 py-3 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'in_progress' ? 'bg-orange-500 text-white shadow' : 'text-slate-500'}`}>
            <Clock size={16}/> Proses
            {orders.filter(o => o.production_status === 'in_production').length > 0 &&
                <span className="bg-white text-orange-600 text-[10px] px-1.5 rounded-full shadow-sm">{orders.filter(o => o.production_status === 'in_production').length}</span>
            }
        </button>
      </div>

      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div> : 
       filteredOrders.length === 0 ? (
         <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Printer className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-400 font-medium">Tidak ada antrian.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOrders.map(order => (
               <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                     <div>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded font-bold">{order.code}</span>
                        <h3 className="font-bold text-slate-800 mt-1">{order.customer_name}</h3>
                        {order.deadline && <div className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1"><Clock size={12}/> DL: {new Date(order.deadline).toLocaleDateString('id-ID')}</div>}
                     </div>
                     {activeTab === 'ready' ? <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Printer size={20}/></div> : <div className="p-2 bg-orange-50 text-orange-600 rounded-full animate-pulse"><Clock size={20}/></div>}
                  </div>
                  <div className="space-y-1 mb-4">
                     {order.items.slice(0, 2).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                           <span className="font-bold text-slate-700 truncate max-w-[60%]">{item.product_name}</span>
                           <span className="bg-slate-200 px-2 py-0.5 rounded text-xs font-bold">{item.quantity}x</span>
                        </div>
                     ))}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); promptMaterialUsage(order.id, activeTab === 'ready' ? 'in_production' : 'completed', order.items); }} 
                    className={`w-full py-3 text-white rounded-xl font-bold flex justify-center items-center gap-2 text-sm shadow-sm ${activeTab === 'ready' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                     {activeTab === 'ready' ? <><Play size={16}/> Mulai Cetak</> : <><CheckCircle size={16}/> QC & Selesai</>}
                  </button>
               </div>
            ))}
         </div>
       )}

       {/* --- MODAL INPUT BAHAN & QC --- */}
       {showMaterialModal && (
         <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-slate-100 bg-white shadow-sm shrink-0 flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-lg text-slate-800">
                       {targetAction?.status === 'in_production' ? 'Persiapan Produksi' : 'QC & Finishing'}
                    </h2>
                    <p className="text-xs text-slate-500">
                       {targetAction?.status === 'in_production' ? 'Pilih bahan baku.' : 'Cek jumlah & bahan tambahan.'}
                    </p>
                </div>
                <button onClick={() => setShowMaterialModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
                
                {/* --- SECTION QC CHECK (Hanya saat Selesai) --- */}
                {targetAction?.status === 'completed' && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                           <ClipboardCheck className="text-green-600"/> Quality Control (QC)
                        </h3>
                        <div className="flex items-center gap-4">
                           <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Target Pesanan</label>
                              <div className="text-xl font-black text-slate-700">{targetAction.targetQty} <span className="text-sm font-normal">pcs</span></div>
                           </div>
                           <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Hasil Produksi (Bagus)</label>
                              <input 
                                 type="number"
                                 className={`w-full p-2 border-b-2 text-xl font-bold outline-none bg-transparent ${Number(qcQty) === targetAction.targetQty ? 'border-green-500 text-green-600' : 'border-slate-300 text-slate-800'}`}
                                 value={qcQty}
                                 onChange={e => setQcQty(e.target.value)}
                              />
                           </div>
                        </div>
                        {Number(qcQty) < targetAction.targetQty && (
                           <p className="text-xs text-orange-500 mt-2 font-medium">⚠️ Hasil kurang dari target (Minus {targetAction.targetQty - Number(qcQty)} pcs)</p>
                        )}
                        {Number(qcQty) > targetAction.targetQty && (
                           <p className="text-xs text-blue-500 mt-2 font-medium">ℹ️ Hasil lebih dari target (Bonus {Number(qcQty) - targetAction.targetQty} pcs)</p>
                        )}
                    </div>
                )}

                {/* --- SECTION BAHAN BAKU --- */}
                <div>
                   <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase">
                      {targetAction?.status === 'in_production' ? 'Bahan Yang Digunakan' : 'Bahan Tambahan / Waste (Opsional)'}
                   </h3>
                   
                   <div className="space-y-3">
                     {usageForm.map((row, index) => (
                        <div key={row.tempId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative animate-in fade-in zoom-in duration-200">
                           <button onClick={() => removeRow(index)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 active:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                           <div className="space-y-3">
                                 <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nama Bahan</label>
                                    <button 
                                       onClick={() => { setActiveRowIndex(index); setShowSearchModal(true); setSearchQuery(''); }}
                                       className={`w-full p-3 rounded-xl border flex justify-between items-center text-left ${row.itemName ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
                                    >
                                       <span className="font-bold text-sm truncate pr-2">{row.itemName || "Cari Bahan..."}</span>
                                       <ChevronRight size={16} className="shrink-0 opacity-50"/>
                                    </button>
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Jumlah Pemakaian {row.unit ? `(${row.unit})` : ''}</label>
                                    <input 
                                       type="number" inputMode="numeric" placeholder="0"
                                       className="w-full p-3 border border-slate-200 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                       value={row.quantity} onChange={e => updateQuantity(index, e.target.value)}
                                    />
                                 </div>
                           </div>
                        </div>
                     ))}
                   </div>

                   <button onClick={addRow} className="w-full py-3 mt-3 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-blue-50 active:scale-95 transition-all">
                      <Plus size={18}/> {usageForm.length === 0 ? 'Tambah Bahan' : 'Tambah Lainnya'}
                   </button>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button onClick={confirmAction} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
                    {targetAction?.status === 'in_production' ? 'Konfirmasi & Mulai' : 'Simpan QC & Selesai'}
                </button>
            </div>
         </div>
       )}

       {/* --- MODAL PENCARIAN (FIX ESLINT Z-INDEX) --- */}
       {showSearchModal && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-200">
              <div className="p-4 border-b border-slate-100 flex gap-3 items-center shadow-sm shrink-0">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                      <input 
                        autoFocus
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="Ketik nama bahan..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      />
                  </div>
                  <button onClick={() => setShowSearchModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">Batal</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
                  {searchResults.length === 0 ? <div className="text-center py-10 text-slate-400">Bahan tidak ditemukan</div> : (
                      <div className="space-y-2">
                        {searchResults.map((m: any) => (
                            <button key={m.id} onClick={() => selectMaterial(m)} className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center text-left hover:border-blue-500 active:bg-blue-50">
                                <div><h4 className="font-bold text-slate-800 text-sm">{m.fullName}</h4><p className="text-xs text-slate-400">Stok: {m.stock} {m.unit}</p></div>
                                <Plus size={18} className="text-blue-600"/>
                            </button>
                        ))}
                      </div>
                  )}
              </div>
          </div>
       )}

       {/* --- MODAL DETAIL ORDER --- */}
       {selectedOrder && (
         <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="font-bold text-lg text-slate-800">Detail Pesanan</h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
               </div>
               <div className="p-6 overflow-y-auto space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><User size={24}/></div>
                     <div><div className="font-bold text-slate-800 text-lg">{selectedOrder.customer_name}</div><div className="text-sm text-slate-500">{selectedOrder.customer_phone}</div></div>
                  </div>
                  <div className="space-y-3">
                     {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <div className="flex justify-between items-start"><h4 className="font-bold text-slate-800">{item.product_name}</h4><span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold">{item.quantity} pcs</span></div>
                           <p className="text-sm text-slate-600 mt-1">{item.packaging_type} • {item.packaging_size}</p>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="p-5 border-t border-slate-100">
                  <button onClick={() => { const id = selectedOrder.id; const items = selectedOrder.items; setSelectedOrder(null); promptMaterialUsage(id, activeTab === 'ready' ? 'in_production' : 'completed', items); }} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg">
                     {activeTab === 'ready' ? 'Mulai Produksi' : 'QC & Selesai'}
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}