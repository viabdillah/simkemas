import { useState, useEffect } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { designService } from '@/services/design.service';

export default function DesignHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    designService.getHistory().then(res => setOrders(res.orders));
  }, []);

  const filtered = orders.filter(o => 
     o.customer_name.toLowerCase().includes(search.toLowerCase()) || 
     o.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Riwayat Desain</h1>
           <p className="text-slate-500 text-sm">Daftar pekerjaan yang telah Anda selesaikan.</p>
        </div>
        <div className="relative w-full max-w-xs">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
           <input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
             value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
               <tr>
                  <th className="p-4">Tanggal Selesai</th>
                  <th className="p-4">No Faktur</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Status Akhir</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">Belum ada riwayat</td></tr>
               ) : (
                  filtered.map(order => (
                     <tr key={order.id} className="hover:bg-slate-50">
                        <td className="p-4 text-slate-500">{new Date(order.updated_at).toLocaleDateString()}</td>
                        <td className="p-4 font-mono font-bold text-slate-700">{order.code}</td>
                        <td className="p-4 font-bold">{order.customer_name}</td>
                        <td className="p-4">
                           <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                              <CheckCircle size={12}/> Siap Cetak
                           </span>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}