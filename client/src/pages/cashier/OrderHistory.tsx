import { useState, useEffect } from 'react';
import { Search, Printer, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { orderService } from '@/services/order.service';

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    orderService.getOrders(search).then(res => setOrders(res.orders));
  }, [search]);

  // Helper Badge Status
  const getStatusBadge = (status: string) => {
    if(status === 'paid') return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Lunas</span>;
    if(status === 'partial') return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">DP</span>;
    return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">Belum Bayar</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Riwayat Pesanan</h1>
           <p className="text-slate-500 text-sm">Daftar transaksi yang telah masuk</p>
        </div>
        <div className="relative w-full max-w-xs">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
           <input type="text" placeholder="Cari No Faktur / Nama..." className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
             value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">No Faktur</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status Bayar</th>
              <th className="p-4">Deadline</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-blue-600">{order.code}</td>
                <td className="p-4">
                    <div className="font-bold">{order.customer_name}</div>
                    <div className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</div>
                </td>
                <td className="p-4 font-bold">Rp {order.total_amount.toLocaleString()}</td>
                <td className="p-4">{getStatusBadge(order.payment_status)}</td>
                <td className="p-4">
                    {order.deadline ? new Date(order.deadline).toLocaleDateString('id-ID') : '-'}
                </td>
                <td className="p-4 text-center">
                   <button 
                     onClick={() => window.open(`/invoice/${order.id}`, '_blank')}
                     className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Cetak Invoice"
                   >
                     <Printer size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}