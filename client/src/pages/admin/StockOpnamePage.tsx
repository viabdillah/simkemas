import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, CheckCircle2, Box, Save, Loader2, X 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { inventoryService } from '@/services/inventory.service';

export default function StockOpnamePage() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // STATE OPNAME (Memory Sementara)
  const [opnameData, setOpnameData] = useState<Record<number, number>>({});
  
  // State Modal Input Fisik
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [tempInput, setTempInput] = useState<string>('');

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    inventoryService.getStocks()
       .then(res => { setStocks(res.stocks); setLoading(false); })
       .catch(() => { Swal.fire('Error', 'Gagal memuat data', 'error'); setLoading(false); });

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const filteredStocks = useMemo(() => {
    return stocks.filter(s => 
        s.material_name.toLowerCase().includes(search.toLowerCase()) || 
        s.item_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [stocks, search]);

  const progressCount = Object.keys(opnameData).length;
  const totalItems = stocks.length;
  const progressPercent = totalItems === 0 ? 0 : Math.round((progressCount / totalItems) * 100);

  const handleExit = async () => {
      if (progressCount > 0) {
          const res = await Swal.fire({
              title: 'Batalkan Opname?',
              text: 'Data yang sudah Anda cek akan hilang dan harus diulang dari awal.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Keluar',
              cancelButtonText: 'Lanjutkan Opname',
              confirmButtonColor: '#ef4444'
          });
          if (!res.isConfirmed) return;
      }
      navigate('/inventory'); 
  };

  const saveItemOpname = () => {
      if (!selectedItem || tempInput === '') return;
      setOpnameData(prev => ({
          ...prev,
          [selectedItem.id]: Number(tempInput)
      }));
      setSelectedItem(null);
      setTempInput('');
  };

  const handleSubmitFinal = async () => {
      if (progressCount === 0) return Swal.fire('Ops', 'Belum ada barang yang di-opname', 'warning');

      // 1. Kumpulkan Data dan Hitung Selisih
      const payload: any[] = [];
      const reviewItems: any[] = []; // Untuk ditampilkan di Pop-up Cek Ulang

      Object.keys(opnameData).forEach(id => {
          const item_id = Number(id);
          const physical_stock = opnameData[item_id];
          const systemItem = stocks.find(s => s.id === item_id);
          
          if (systemItem) {
              payload.push({ item_id, physical_stock });
              
              const diff = physical_stock - systemItem.stock;
              if (diff !== 0) {
                  reviewItems.push({
                      name: systemItem.material_name,
                      old: systemItem.stock,
                      new: physical_stock,
                      diff: diff,
                      unit: systemItem.unit
                  });
              }
          }
      });

      // 2. Buat Tampilan HTML untuk Pop-up Cek Ulang
      let htmlReview = '<div class="text-sm text-left mt-2 mb-4 bg-slate-50 p-3 rounded-xl max-h-48 overflow-y-auto border border-slate-200">';
      if (reviewItems.length === 0) {
          htmlReview += '<div class="text-green-600 font-bold text-center py-2">Semua stok seimbang (Tidak ada selisih).</div>';
      } else {
          reviewItems.forEach(item => {
              const diffText = item.diff > 0 ? `<span class="text-blue-600 font-bold">(+${item.diff})</span>` : `<span class="text-red-600 font-bold">(${item.diff})</span>`;
              htmlReview += `
                 <div class="mb-2 pb-2 border-b border-slate-200 last:border-0">
                    <div class="font-bold text-slate-700">${item.name}</div>
                    <div class="text-xs text-slate-500">Sistem: ${item.old} ➔ Fisik: <span class="font-black text-slate-800">${item.new}</span> ${item.unit} ${diffText}</div>
                 </div>
              `;
          });
      }
      htmlReview += '</div>';

      // 3. Tampilkan Pop-up Konfirmasi (Cek Ulang)
      const confirm = await Swal.fire({
          title: 'Cek Ulang Hasil Opname',
          html: `Pastikan data berikut sudah benar sebelum disimpan permanen:<br/>${htmlReview}`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Ya, Simpan Final',
          cancelButtonText: 'Kembali Cek',
          confirmButtonColor: '#0f172a'
      });

      if (!confirm.isConfirmed) return; // Batal simpan, kembali ke halaman opname

      // 4. Proses Simpan jika dikonfirmasi
      try {
          Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          await inventoryService.batchOpname({ items: payload, note: 'Opname Mode Fokus' });
          Swal.fire('Berhasil', 'Stok berhasil disesuaikan', 'success');
          navigate('/inventory');
      } catch (e) {
          console.error(e);
          Swal.fire('Gagal', 'Terjadi kesalahan sistem', 'error');
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 size-10"/></div>;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
       {/* HEADER FOCUS MODE */}
       <div className="bg-white p-4 shadow-sm shrink-0 border-b border-slate-200">
           <div className="flex justify-between items-center mb-4">
               <button onClick={handleExit} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full active:scale-95">
                   <ArrowLeft size={24}/>
               </button>
               <h1 className="font-bold text-lg text-slate-800">Sesi Stok Opname</h1>
               <div className="w-8"></div>
           </div>
           
           <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
               <span>Progress: {progressCount} dari {totalItems} Barang</span>
               <span className={progressPercent === 100 ? 'text-green-600' : 'text-blue-600'}>{progressPercent}%</span>
           </div>
           <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progressPercent}%` }}></div>
           </div>
       </div>

       {/* PENCARIAN & LIST BARANG */}
       <div className="flex-1 overflow-y-auto p-4 pb-28">
           <div className="relative mb-4">
               <Search className="absolute left-4 top-3.5 text-slate-400" size={18}/>
               <input 
                  type="text" 
                  placeholder="Cari nama barang..." 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:border-blue-500"
                  value={search} onChange={e => setSearch(e.target.value)}
               />
           </div>

           <div className="space-y-3">
               {filteredStocks.map(s => {
                   const isChecked = opnameData[s.id] !== undefined;
                   const physical = opnameData[s.id];
                   const diff = isChecked ? physical - s.stock : 0;

                   return (
                       <div 
                          key={s.id} 
                          onClick={() => { setSelectedItem(s); setTempInput(isChecked ? String(physical) : ''); }}
                          className={`p-4 rounded-2xl border flex justify-between items-center transition-all cursor-pointer active:scale-[0.98] ${isChecked ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-200 shadow-sm'}`}
                       >
                           <div className="flex-1 pr-2">
                               <h3 className={`font-bold text-sm ${isChecked ? 'text-green-800' : 'text-slate-800'}`}>{s.material_name}</h3>
                               <p className="text-xs text-slate-500 mt-0.5">{s.item_name}</p>
                               {isChecked && diff !== 0 && (
                                   <div className={`text-[10px] font-bold mt-2 px-2 py-0.5 rounded-md inline-block ${diff > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                       Selisih {diff > 0 ? '+' : ''}{diff} {s.unit}
                                   </div>
                               )}
                           </div>
                           
                           <div className="text-right">
                               {isChecked ? (
                                   <div className="flex flex-col items-end">
                                      <CheckCircle2 className="text-green-500 mb-1" size={20}/>
                                      <span className="text-[10px] font-bold text-green-600 uppercase">Fisik: {physical}</span>
                                   </div>
                               ) : (
                                   <div className="flex flex-col items-end opacity-40">
                                      <Box className="text-slate-400 mb-1" size={20}/>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase">Hitung</span>
                                   </div>
                               )}
                           </div>
                       </div>
                   );
               })}
           </div>
       </div>

       {/* FLOATING ACTION BOTTOM */}
       <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
           <button 
              onClick={handleSubmitFinal}
              disabled={progressCount === 0}
              className={`w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg transition-all ${progressPercent === 100 ? 'bg-green-600 hover:bg-green-700 text-white' : progressCount > 0 ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
           >
               <Save size={20}/> 
               {progressPercent === 100 ? 'Selesai Sempurna! Simpan' : `Simpan Hasil Opname (${progressCount})`}
           </button>
       </div>

       {/* MODAL INPUT FISIK */}
       {selectedItem && (
           <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200">
                   <div className="flex justify-between items-start mb-4">
                       <div>
                           <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase mb-1 inline-block">Hitung Fisik</div>
                           <h2 className="font-bold text-slate-800 leading-tight">{selectedItem.material_name}</h2>
                           <p className="text-xs text-slate-500">{selectedItem.item_name}</p>
                       </div>
                       <button onClick={() => setSelectedItem(null)} className="p-1 bg-slate-100 rounded-full text-slate-400"><X size={16}/></button>
                   </div>
                   
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center mb-5">
                       <span className="text-xs font-bold text-slate-500">Stok Sistem Saat Ini:</span>
                       <span className="font-black text-slate-800">{selectedItem.stock} <span className="text-[10px] font-normal">{selectedItem.unit}</span></span>
                   </div>

                   <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Masukkan Jumlah Fisik Real</label>
                   <input 
                       autoFocus
                       type="number" inputMode="numeric"
                       className="w-full text-center text-3xl font-black p-4 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-blue-50 text-slate-800 transition-colors"
                       placeholder="0"
                       value={tempInput}
                       onChange={e => setTempInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && saveItemOpname()}
                   />

                   <button onClick={saveItemOpname} className="w-full py-3 mt-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform">
                       Tandai Selesai
                   </button>
               </div>
           </div>
       )}
    </div>
  );
}