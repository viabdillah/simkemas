import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ShoppingBag, Search, User, CheckCircle, DollarSign, 
  AlertTriangle, PackageCheck, Loader2, X, Wallet
} from 'lucide-react';
import Swal from 'sweetalert2';
import { pickupService } from '@/services/pickup.service';

// --- HELPER FORMATTER ---
const fmtMoney = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatInputRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
        const separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
};

export default function PickupPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Form State
  const [adjustment, setAdjustment] = useState<string>(''); 
  const [payAmountRaw, setPayAmountRaw] = useState<number>(0);
  const [payAmountDisplay, setPayAmountDisplay] = useState<string>('');
  const [note, setNote] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pickupService.getReadyOrders();
      setOrders(res.orders);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
       o.customer_name.toLowerCase().includes(search.toLowerCase()) || 
       o.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  // --- LOGIC HITUNGAN ---
  const calculation = useMemo(() => {
      if (!selectedOrder) return { totalAwal: 0, totalAkhir: 0, sudahBayar: 0, sisaTagihan: 0 };
      
      const disc = Number(adjustment) || 0;
      const totalAwal = selectedOrder.total_amount;
      const totalAkhir = totalAwal - disc;
      const sudahBayar = selectedOrder.paid_amount;
      const sisa = totalAkhir - sudahBayar;
      
      return { 
          totalAwal, 
          totalAkhir, 
          sudahBayar, 
          sisaTagihan: sisa > 0 ? sisa : 0 
      };
  }, [selectedOrder, adjustment]);

  const handlePayInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const raw = Number(val.replace(/\./g, '').replace(/[^0-9]/g, ''));
      setPayAmountRaw(raw);
      setPayAmountDisplay(formatInputRupiah(val));
  };

  const handleSetFull = () => {
      const sisa = calculation.sisaTagihan;
      setPayAmountRaw(sisa);
      setPayAmountDisplay(formatInputRupiah(String(sisa)));
  };

  const handleProcess = async (actionType: 'pickup_now' | 'pay_only') => {
      if (!selectedOrder) return;

      const bayar = payAmountRaw;
      const isLunas = (bayar + calculation.sudahBayar) >= (calculation.totalAkhir - 100);

      // Warning jika ambil barang tapi belum lunas
      if (actionType === 'pickup_now' && !isLunas) {
          const confirm = await Swal.fire({
              title: 'Belum Lunas!',
              text: "Barang akan diambil tapi pembayaran belum lunas. Yakin lanjut?",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Serahkan Barang',
              confirmButtonColor: '#d33'
          });
          if (!confirm.isConfirmed) return;
      }

      try {
          await pickupService.processPickup(selectedOrder.id, {
              adjustment: Number(adjustment),
              paymentAmount: bayar,
              note: note,
              actionType: actionType
          });
          
          Swal.fire({
              icon: 'success',
              title: actionType === 'pickup_now' ? 'Transaksi Selesai' : 'Pembayaran Diterima',
              text: actionType === 'pickup_now' ? 'Barang telah diserahkan.' : 'Barang masih disimpan di toko.',
              timer: 2000,
              showConfirmButton: false
          });

          setSelectedOrder(null);
          setAdjustment('');
          setPayAmountRaw(0);
          setPayAmountDisplay('');
          setNote('');
          fetchOrders();
      } catch (e) {
          console.error(e);
          Swal.fire('Gagal', 'Terjadi kesalahan sistem', 'error');
      }
  };

  const openModal = (order: any) => {
      setSelectedOrder(order);
      setAdjustment('');
      
      // Auto-fill jika ada sisa tagihan
      const sisa = order.total_amount - order.paid_amount;
      if(sisa > 0) {
          setPayAmountRaw(sisa);
          setPayAmountDisplay(formatInputRupiah(String(sisa)));
      } else {
          setPayAmountRaw(0);
          setPayAmountDisplay('');
      }
      setNote(order.note || '');
  };

  return (
    <div className="space-y-6 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Pengambilan Barang</h1>
           <p className="text-slate-500 text-sm">Serah terima barang selesai & pelunasan.</p>
        </div>
        <div className="relative w-full md:w-auto">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
           <input className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
             placeholder="Cari faktur / nama..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div> : 
       filteredOrders.length === 0 ? (
         <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
            <PackageCheck className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-400 font-medium">Tidak ada barang siap ambil.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
               <div key={order.id} onClick={() => openModal(order)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden">
                  
                  {/* Status Ribbon Lunas */}
                  {order.payment_status === 'paid' && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                          <CheckCircle size={10}/> LUNAS
                      </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <span className="bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded font-bold">{order.code}</span>
                        <h3 className="font-bold text-lg text-slate-800 mt-1">{order.customer_name}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><User size={12}/> {order.customer_phone}</div>
                     </div>
                     <div className="bg-blue-50 p-2 rounded-full text-blue-600"><ShoppingBag size={20}/></div>
                  </div>

                  {/* QC Summary */}
                  {order.actual_quantity > 0 && (
                      <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-sm">
                          <span className="text-slate-500">Hasil Produksi:</span>
                          <span className={`font-bold ${order.actual_quantity < 100 ? 'text-orange-600' : 'text-slate-700'}`}>
                              {order.actual_quantity} pcs
                          </span>
                      </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                          Total: <span className="font-bold text-slate-700">{fmtMoney(order.total_amount)}</span>
                      </div>
                      {order.payment_status !== 'paid' && (
                          <span className="text-xs px-2 py-1 rounded font-bold bg-red-100 text-red-700">
                             Belum Lunas
                          </span>
                      )}
                  </div>
               </div>
            ))}
         </div>
       )}

       {/* --- MODAL TRANSAKSI --- */}
       {selectedOrder && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                  <div>
                     <h2 className="font-bold text-lg text-slate-800">Pembayaran & Ambil</h2>
                     <p className="text-xs text-slate-500">{selectedOrder.code}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 border border-slate-200"><X size={18}/></button>
               </div>

               <div className="p-6 overflow-y-auto space-y-6">
                  
                  {/* Warning QC */}
                  {selectedOrder.actual_quantity > 0 && selectedOrder.items.length > 0 && selectedOrder.actual_quantity < selectedOrder.items[0].quantity && (
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex gap-3 items-start">
                          <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={18}/>
                          <div>
                              <h4 className="text-sm font-bold text-orange-700">Hasil Produksi Kurang!</h4>
                              <p className="text-xs text-orange-600 mt-1">
                                  Target: {selectedOrder.items[0].quantity}, Actual: {selectedOrder.actual_quantity}.
                              </p>
                          </div>
                      </div>
                  )}

                  {/* Rincian Biaya */}
                  <div className="space-y-3 bg-white border-2 border-slate-100 border-dashed p-4 rounded-xl">
                      <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total Tagihan Awal</span>
                          <span className="font-bold text-slate-700">{fmtMoney(calculation.totalAwal)}</span>
                      </div>
                      
                      {/* Input Potongan */}
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-orange-600 font-bold flex items-center gap-1"><DollarSign size={14}/> Potongan / Kompensasi</span>
                          <input 
                             type="number" 
                             placeholder="0"
                             className="w-32 p-1 text-right border-b border-slate-300 bg-transparent outline-none focus:border-orange-500 font-bold text-orange-600"
                             value={adjustment}
                             onChange={e => setAdjustment(e.target.value)}
                          />
                      </div>

                      <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Sudah Dibayar (DP)</span>
                          <span className="font-bold text-green-600">-{fmtMoney(calculation.sudahBayar)}</span>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                          <span className="font-bold text-slate-800">SISA TAGIHAN</span>
                          <span className="font-black text-xl text-blue-600">{fmtMoney(calculation.sisaTagihan)}</span>
                      </div>
                  </div>

                  {/* Input Pelunasan (Hanya jika belum lunas) */}
                  {calculation.sisaTagihan > 0 ? (
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bayar Sekarang</label>
                          <div className="relative">
                              <span className="absolute left-4 top-4 text-slate-400 font-bold">Rp</span>
                              <input 
                                 type="text" 
                                 inputMode="numeric"
                                 className="w-full pl-10 pr-4 py-3.5 border border-slate-300 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                 placeholder="0"
                                 value={payAmountDisplay}
                                 onChange={handlePayInput}
                              />
                              <button 
                                onClick={handleSetFull}
                                className="absolute right-2 top-2 bottom-2 px-3 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100"
                              >
                                  Bayar Pas
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="bg-green-100 text-green-700 p-3 rounded-xl text-center font-bold text-sm flex justify-center items-center gap-2">
                          <CheckCircle size={18}/> Tagihan Lunas
                      </div>
                  )}

                  {/* Catatan */}
                  <textarea 
                     placeholder="Catatan pengambilan (opsional)..."
                     className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-20 text-sm"
                     value={note} onChange={e => setNote(e.target.value)}
                  ></textarea>

               </div>

               {/* REVISI FOOTER: TOMBOL KONDISIONAL */}
               <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
                   
                   {/* Tombol Bayar Dulu (HANYA MUNCUL JIKA MASIH ADA TAGIHAN) */}
                   {calculation.sisaTagihan > 0 && (
                       <button 
                            onClick={() => handleProcess('pay_only')} 
                            className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                       >
                           <div className="flex items-center gap-2"><Wallet size={16}/> Bayar Dulu</div>
                           <span className="text-[10px] font-normal text-slate-500">Barang di toko</span>
                       </button>
                   )}
                   
                   {/* Tombol Selesai & Ambil (SELALU MUNCUL, WIDTH OTOMATIS PENUH) */}
                   <button 
                        onClick={() => handleProcess('pickup_now')} 
                        className="flex-1 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                   >
                       <div className="flex items-center gap-2"><PackageCheck size={16}/> Selesai & Ambil</div>
                       <span className="text-[10px] font-normal text-slate-400">Transaksi beres</span>
                   </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}