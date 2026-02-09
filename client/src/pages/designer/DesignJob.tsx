import { useState, useEffect } from 'react';
import { 
  PenTool, CheckCircle, AlertTriangle, FileCheck, 
  Clock, Layout, Loader2, X, User, Phone, Calendar, Box,
  Scale, FileText, Tag, ShieldCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { designService } from '@/services/design.service';

export default function DesignJob() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new_design' | 'check_file' | 'in_progress'>('new_design');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await designService.getQueue();
      setOrders(res.orders);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQueue(); }, []);

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'in_progress') {
        return o.production_status === 'in_design' || o.production_status === 'design_revision';
    }
    if (o.production_status === 'pending_design') {
        const needsDesign = o.items.some((i: any) => i.has_design === 0);
        if (activeTab === 'new_design') return needsDesign;
        if (activeTab === 'check_file') return !needsDesign;
    }
    return false;
  });

  const handleStartDesign = async (id: number) => {
    await designService.updateStatus(id, 'in_design');
    fetchQueue();
    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    Toast.fire({ icon: 'success', title: 'Mulai mengerjakan...' });
  };

  const handleFinish = async (id: number) => {
    Swal.fire({
      title: 'Desain Fix / File Aman?',
      text: "Pesanan akan diteruskan ke Operator Cetak.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjut Cetak',
      confirmButtonColor: '#16a34a'
    }).then(async (res) => {
      if (res.isConfirmed) {
        await designService.updateStatus(id, 'ready_to_print');
        fetchQueue();
        Swal.fire('Berhasil', 'Pesanan masuk antrian cetak', 'success');
      }
    });
  };

  const handleRevision = async (id: number) => {
    const { value: text } = await Swal.fire({
      title: 'Catatan Revisi / Masalah File',
      input: 'textarea',
      inputLabel: 'Jelaskan kekurangan file atau revisi yang diminta',
      inputPlaceholder: 'Contoh: Resolusi pecah, font hilang...',
      showCancelButton: true
    });

    if (text) {
      await designService.updateStatus(id, 'design_revision', text);
      fetchQueue();
      Swal.fire('Status Diubah', 'Pesanan ditandai butuh revisi', 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Tugas Desain</h1>
           <p className="text-slate-500 text-sm">Kelola pesanan yang membutuhkan proses pracetak.</p>
        </div>
        <button onClick={fetchQueue} className="text-blue-600 text-sm font-bold hover:underline">Refresh Data</button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
        <button onClick={() => setActiveTab('new_design')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'new_design' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><PenTool size={16}/> Buat Desain Baru</button>
        <button onClick={() => setActiveTab('check_file')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'check_file' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}><FileCheck size={16}/> Cek File Masuk</button>
        <button onClick={() => setActiveTab('in_progress')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'in_progress' ? 'bg-white shadow text-orange-600' : 'text-slate-500'}`}><Clock size={16}/> Sedang Dikerjakan</button>
      </div>

      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div> : 
       filteredOrders.length === 0 ? (
         <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
            <Layout className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-400 font-medium">Tidak ada antrian di kategori ini.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map(order => (
               <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{order.code}</span>
                           <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                           {order.deadline && <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><Clock size={12}/> DL: {new Date(order.deadline).toLocaleDateString('id-ID')}</span>}
                           {order.production_status === 'design_revision' && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><AlertTriangle size={12}/> Revisi</span>}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{order.customer_name}</h3>
                        <div className="mt-3 space-y-1">
                           {order.items.slice(0, 2).map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                 {item.has_design === 1 ? <FileCheck size={16} className="text-green-500 shrink-0"/> : <PenTool size={16} className="text-blue-500 shrink-0"/>}
                                 <span className="font-bold">{item.quantity}x</span>
                                 <span>{item.product_name}</span>
                                 <span className="text-xs text-slate-400 ml-auto hidden sm:block">{item.packaging_type}</span>
                              </div>
                           ))}
                           {order.items.length > 2 && <div className="text-xs text-slate-400 pl-2">+ {order.items.length - 2} item lainnya... (Klik untuk detail)</div>}
                        </div>
                     </div>
                     <div className="flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4 min-w-37.5">
                        {(activeTab === 'new_design' || activeTab === 'check_file') && (
                           <button onClick={(e) => { e.stopPropagation(); handleStartDesign(order.id); }} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md transition-all"><PenTool size={16}/> Mulai</button>
                        )}
                        {activeTab === 'in_progress' && (
                           <>
                              <button onClick={(e) => { e.stopPropagation(); handleFinish(order.id); }} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md transition-all"><CheckCircle size={16}/> Selesai / Fix</button>
                              <button onClick={(e) => { e.stopPropagation(); handleRevision(order.id); }} className="flex-1 bg-white border border-orange-200 text-orange-600 px-4 py-2 rounded-xl font-bold hover:bg-orange-50 flex items-center justify-center gap-2 text-sm"><AlertTriangle size={16}/> Ada Revisi</button>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            ))}
         </div>
       )}

       {/* --- MODAL DETAIL PESANAN LENGKAP --- */}
       {selectedOrder && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
               
               {/* Header Modal */}
               <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-3xl">
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-700 text-xs font-mono px-2 py-0.5 rounded font-bold">{selectedOrder.code}</span>
                        {selectedOrder.deadline && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1"><Clock size={12}/> Deadline: {new Date(selectedOrder.deadline).toLocaleDateString('id-ID')}</span>}
                     </div>
                     <h2 className="text-xl font-bold text-slate-800">Detail Pesanan</h2>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200"><X size={20}/></button>
               </div>

               {/* Body Modal */}
               <div className="p-6 overflow-y-auto space-y-6">
                  
                  {/* Info Pelanggan */}
                  <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                     <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm h-fit"><User size={24}/></div>
                     <div>
                        <h3 className="font-bold text-slate-800 text-lg">{selectedOrder.customer_name}</h3>
                        <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-slate-500 mt-1">
                           <span className="flex items-center gap-1"><Phone size={14}/> {selectedOrder.customer_phone || '-'}</span>
                           <span className="flex items-center gap-1"><Calendar size={14}/> Tgl Order: {new Date(selectedOrder.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                     </div>
                  </div>

                  {/* List Item Lengkap */}
                  <div>
                     <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Box size={18}/> Daftar Item ({selectedOrder.items.length})</h3>
                     <div className="space-y-4">
                        {selectedOrder.items.map((item: any, idx: number) => (
                           <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
                              {/* Indikator Status Desain */}
                              <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold ${item.has_design ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                 {item.has_design ? 'File Siap' : 'Perlu Desain'}
                              </div>

                              <div className="mb-3">
                                 <h4 className="font-bold text-slate-800 text-lg">{item.product_name}</h4>
                                 <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                                    <Tag size={14}/> {item.packaging_type} 
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span> 
                                    <Scale size={14}/> {item.packaging_size} ({item.netto})
                                 </p>
                              </div>

                              {/* Informasi Detail Varian & Legalitas */}
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Varian Rasa</span>
                                    <span className="font-bold text-slate-700 text-sm">{item.variant}</span>
                                 </div>
                                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Jumlah Cetak</span>
                                    <span className="font-bold text-slate-700 text-sm">{item.quantity} pcs</span>
                                 </div>
                              </div>

                              {/* Info Legalitas (Jika Ada) */}
                              <div className="flex flex-wrap gap-2">
                                 {item.pirt && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 flex items-center gap-1"><ShieldCheck size={12}/> PIRT: {item.pirt}</span>}
                                 {item.halal && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 flex items-center gap-1"><ShieldCheck size={12}/> HALAL: {item.halal}</span>}
                                 {item.nib && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 flex items-center gap-1"><FileText size={12}/> NIB: {item.nib}</span>}
                              </div>

                              {item.note && (
                                 <div className="mt-3 text-xs text-slate-600 italic bg-yellow-50 p-2 rounded border border-yellow-100">
                                    <span className="font-bold not-italic text-yellow-700">Catatan Item:</span> "{item.note}"
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Catatan Umum */}
                  {selectedOrder.note && (
                     <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-yellow-700 uppercase mb-1">Catatan Umum Pesanan</h4>
                        <p className="text-sm text-yellow-800">{selectedOrder.note}</p>
                     </div>
                  )}
               </div>

               {/* Footer Modal */}
               <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl shrink-0 flex justify-end gap-3">
                  <button onClick={() => setSelectedOrder(null)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100">Tutup</button>
                  {activeTab !== 'in_progress' && (
                     <button onClick={() => { handleStartDesign(selectedOrder.id); setSelectedOrder(null); }} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">Mulai Kerjakan</button>
                  )}
               </div>

            </div>
         </div>
       )}

    </div>
  );
}