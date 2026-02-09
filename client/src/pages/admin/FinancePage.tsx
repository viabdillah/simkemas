import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Wallet, Plus, Calendar, 
  ArrowUpRight, ArrowDownRight, Loader2, X 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { financeService } from '@/services/finance.service';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_in: 0, total_out: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filter Date
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  
  // Form State (Gunakan 'amountDisplay' untuk tampilan string rupiah)
  const [form, setForm] = useState({ 
    type: 'out', 
    amountDisplay: '', // Ganti dari number ke string agar bisa diformat
    description: '', 
    category: 'Operasional' 
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await financeService.getTransactions(dateRange.start, dateRange.end);
      setTransactions(res.transactions);
      setSummary(res.summary);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false);  
    }
  };

  useEffect(() => { fetchData(); }, [dateRange]);

  // --- HELPER FORMATTER RUPIAH ---
  const formatRupiah = (value: string) => {
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

  const parseRupiah = (formatted: string) => {
    return Number(formatted.replace(/[^0-9,-]+/g, ''));
  };
  // --------------------------------

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse kembali string "20.000" menjadi number 20000
    const rawAmount = parseRupiah(form.amountDisplay);

    if (rawAmount <= 0 || !form.description) return;

    try {
      const payload = {
        type: form.type,
        amount: rawAmount, // Kirim number murni ke API
        description: form.description,
        category: form.category
      };

      await financeService.createTransaction(payload as any);
      
      Swal.fire('Sukses', 'Transaksi berhasil dicatat', 'success');
      setShowModal(false);
      
      // Reset Form
      setForm({ type: 'out', amountDisplay: '', description: '', category: 'Operasional' });
      fetchData();
    } catch {
      Swal.fire('Gagal', 'Terjadi kesalahan', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Keuangan & Arus Kas</h1>
          <p className="text-slate-500 text-sm">Pantau pemasukan dan pengeluaran operasional.</p>
        </div>
        <div className="flex gap-2">
           <input type="date" className="p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setDateRange({...dateRange, start: e.target.value})} />
           <span className="self-center text-slate-400">-</span>
           <input type="date" className="p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setDateRange({...dateRange, end: e.target.value})} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
           <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingUp size={20}/></div>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">PEMASUKAN</span>
           </div>
           <h3 className="text-2xl font-black text-slate-800">Rp {summary.total_in.toLocaleString()}</h3>
        </div>
        
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
           <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendingDown size={20}/></div>
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">PENGELUARAN</span>
           </div>
           <h3 className="text-2xl font-black text-slate-800">Rp {summary.total_out.toLocaleString()}</h3>
        </div>

        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
           <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Wallet size={20}/></div>
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">SALDO BERSIH</span>
           </div>
           <h3 className={`text-2xl font-black ${summary.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
             Rp {summary.balance.toLocaleString()}
           </h3>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
         <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
            <Plus size={18} /> Catat Transaksi Manual
         </button>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
               <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4 text-right">Nominal</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {loading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin inline text-blue-600"/></td></tr>
               ) : transactions.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">Belum ada transaksi</td></tr>
               ) : (
                  transactions.map((t) => (
                     <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-4 text-slate-500">
                           <div className="flex items-center gap-2">
                              <Calendar size={14}/>
                              {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </td>
                        <td className="p-4 font-medium text-slate-800">{t.description}</td>
                        <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{t.category || '-'}</span></td>
                        <td className={`p-4 text-right font-bold ${t.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                           <div className="flex items-center justify-end gap-1">
                              {t.type === 'in' ? '+' : '-'} Rp {t.amount.toLocaleString()}
                              {t.type === 'in' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                           </div>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>

      {/* MODAL TRANSACTION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg text-slate-800">Catat Transaksi</h3>
                 <button onClick={() => setShowModal(false)} className="bg-slate-100 p-1.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={18}/></button>
              </div>
              
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                 
                 {/* SWITCH TIPE TRANSAKSI */}
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        type="button"
                        onClick={() => setForm({...form, type: 'in', category: 'Hibah/Modal'})}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.type === 'in' ? 'bg-green-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pemasukan
                    </button>
                    <button 
                        type="button"
                        onClick={() => setForm({...form, type: 'out', category: 'Operasional'})}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.type === 'out' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pengeluaran
                    </button>
                 </div>

                 {/* KATEGORI DINAMIS */}
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
                    <select className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                        value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        {form.type === 'in' ? (
                            <>
                                <option>Hibah/Modal</option>
                                <option>Investasi</option>
                                <option>Penjualan Aset</option>
                                <option>Lainnya</option>
                            </>
                        ) : (
                            <>
                                <option>Operasional</option>
                                <option>Bahan Baku</option>
                                <option>Gaji Karyawan</option>
                                <option>Listrik & Air</option>
                                <option>Lainnya</option>
                            </>
                        )}
                    </select>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Keterangan</label>
                    <textarea required className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" 
                        placeholder={form.type === 'in' ? "Cth: Suntikan Dana Hibah 2024" : "Cth: Beli Tinta Printer"}
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                 </div>

                 {/* INPUT NOMINAL DENGAN FORMATTER (REVISI) */}
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Nominal (Rp)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">Rp</span>
                        <input 
                            type="text" 
                            required 
                            placeholder="0"
                            className="w-full pl-9 p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono"
                            value={form.amountDisplay} 
                            onChange={e => setForm({...form, amountDisplay: formatRupiah(e.target.value)})} 
                        />
                    </div>
                 </div>

                 <button type="submit" className={`w-full py-3 text-white font-bold rounded-xl shadow-lg mt-2 ${form.type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    Simpan {form.type === 'in' ? 'Pemasukan' : 'Pengeluaran'}
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}