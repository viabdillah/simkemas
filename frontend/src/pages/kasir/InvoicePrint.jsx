import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Printer} from 'lucide-react';

export default function InvoicePrint() {
  const { invoiceNo } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/transactions/${invoiceNo}`);
        const result = await res.json();
        if (res.ok && result.ok) {
          setData(result.data);
        } else {
          toast.error("Gagal memuat invoice", { description: result.error });
        }
      } catch (err) {
        console.error(err);
        toast.error("Terjadi kesalahan server");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (invoiceNo) fetchInvoice();
  }, [invoiceNo]);

  // Fungsi Cetak (Memanggil dialog Print bawaan Browser)
  const handlePrint = () => {
    window.print();
  };

  // Helper Format Rupiah
  const formatRp = (angka) => `Rp ${parseInt(angka).toLocaleString('id-ID')}`;
  
  // Helper Format Tanggal
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  }

  if (!data || !data.transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Invoice Tidak Ditemukan</h1>
        <Button onClick={() => navigate('/kasir')}>Kembali ke POS</Button>
      </div>
    );
  }

  const { transaction, items } = data;
  const sisaPelunasan = Math.max(0, transaction.total_amount - transaction.dp_amount);

  return (
    <div className="min-h-screen bg-slate-200 p-4 sm:p-8 font-sans print:bg-white print:p-0">
      
      {/* Tombol Aksi (AKAN HILANG SAAT DICETAK KARENA CLASS 'print:hidden') */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between print:hidden">
        {/* <Button variant="outline" className="bg-white" onClick={() => navigate('/kasir')}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Kembali
        </Button> */}
        <Button onClick={handlePrint} className="bg-primary shadow-lg cursor-pointer">
          <Printer className="mr-2 w-4 h-4" /> Cetak Invoice
        </Button>
      </div>

      {/* Kertas Invoice Utama */}
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none print:max-w-full">
        
        {/* Header Kop Surat */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-2xl mb-2">
              <img src="/logo-invoice.png" alt="SIMKEMAS" className="h-8 w-auto" /> SIMKEMAS
            </div>
            <p className="text-sm text-slate-600">Jl. Soekarno-Hatta, Kaduagung Tengah, Cibadak, Lebak, Banten 42317</p>
            <p className="text-sm text-slate-600">Telp: +62 851-8304-3381 | Web: -</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-widest mb-1">INVOICE</h1>
            <p className="text-sm font-bold text-slate-700">{transaction.invoice_no}</p>
            <p className="text-xs text-slate-500 mt-2">Diterbitkan: {formatDate(transaction.created_at)}</p>
          </div>
        </div>

        {/* Info Pelanggan & Status */}
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tagihan Kepada:</p>
            <p className="text-lg font-bold text-slate-900">{transaction.umkm_name}</p>
            <p className="text-sm text-slate-700">WA: {transaction.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Batas Waktu Pengambilan:</p>
            <p className="text-md font-bold text-slate-900">{formatDate(transaction.deadline)}</p>
            <div className="mt-2 inline-block px-3 py-1 rounded-full border-2 text-sm font-bold uppercase
              ${transaction.status === 'Lunas' ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'}">
              {transaction.status}
            </div>
          </div>
        </div>

        {/* Tabel Rincian Pesanan */}
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-900">
              <th className="py-3 font-bold text-sm">Deskripsi Kemasan</th>
              <th className="py-3 font-bold text-sm text-center">Qty</th>
              <th className="py-3 font-bold text-sm text-right">Harga Satuan</th>
              <th className="py-3 font-bold text-sm text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className={index !== items.length - 1 ? 'border-b border-slate-200' : ''}>
                <td className="py-4">
                  <p className="font-bold text-slate-900">{item.nama_kemasan} ({item.merek_kemasan})</p>
                  <p className="text-xs text-slate-600">Jenis: {item.jenis_kemasan} | Label: {item.label_kemasan}</p>
                  {item.catatan && <p className="text-xs text-slate-500 italic mt-1">Catatan: {item.catatan}</p>}
                </td>
                <td className="py-4 text-center font-medium">{item.qty}</td>
                <td className="py-4 text-right">{formatRp(item.price)}</td>
                <td className="py-4 text-right font-bold">{formatRp(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Kalkulasi Total */}
        <div className="flex justify-end">
          <div className="w-full sm:w-1/2 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Sub Total:</span>
              <span>{formatRp(transaction.total_amount + transaction.discount)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Diskon:</span>
                <span>- {formatRp(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black text-slate-900 border-t-2 border-slate-800 pt-2">
              <span>GRAND TOTAL:</span>
              <span>{formatRp(transaction.total_amount)}</span>
            </div>
            
            <div className="pt-4 space-y-1">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Metode Pembayaran:</span>
                <span className="font-bold uppercase">{transaction.payment_type === 'full' ? 'Lunas' : transaction.payment_type === 'dp' ? 'Uang Muka (DP)' : 'Tempo / Bayar Nanti'}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>DP Masuk:</span>
                <span>{formatRp(transaction.dp_amount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-600 border-t border-slate-200 pt-1">
                <span>SISA TAGIHAN:</span>
                <span>{formatRp(sisaPelunasan)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Catatan */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>Terima kasih telah mempercayakan kemasan produk Anda kepada SIMKEMAS.</p>
          <p>Harap bawa invoice ini pada saat pengambilan barang.</p>
        </div>

      </div>
    </div>
  );
}