import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, CheckCircle2 } from 'lucide-react';

export default function WorkOrderPrint() {
  const { invoiceNo } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSPK = async () => {
      try {
        const res = await fetch(`/api/transactions/${invoiceNo}`);
        const result = await res.json();
        if (res.ok && result.ok) {
          setData(result.data);
        } else {
          toast.error("Gagal memuat Surat Perintah Kerja", { description: result.error });
        }
      } catch (err) {
        console.error(err);
        toast.error("Terjadi kesalahan server");
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceNo) fetchSPK();
  }, [invoiceNo]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-200">
        <Loader2 className="animate-spin text-amber-600 w-12 h-12" />
      </div>
    );
  }

  if (!data || !data.transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">SPK Tidak Ditemukan</h1>
        <Button onClick={() => navigate('/kasir')} className="cursor-pointer">Kembali ke POS</Button>
      </div>
    );
  }

  const { transaction, items } = data;

  // Logika Penentuan Status Per Divisi
  const currentStage = transaction.current_stage || 'Desainer'; 
  
  const getStatus = (roleIndex) => {
    const stages = ['Desainer', 'Operator Mesin', 'Operator Packaging', 'Kasir', 'Selesai'];
    let currentIndex = stages.indexOf(currentStage);
    if (currentIndex === -1) currentIndex = 0;

    if (currentIndex > roleIndex) return 'APPROVED';
    if (currentIndex === roleIndex) return 'PROSES';
    return 'MENUNGGU';
  };

  const renderBadge = (statusText) => {
    if (statusText === 'APPROVED') {
      return (
        <div className="mt-2 flex items-center justify-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-300 py-1 px-3 rounded-full font-bold w-fit mx-auto print:border-none print:bg-transparent print:p-0">
          <CheckCircle2 size={14} className="text-emerald-600" /> <span className="text-[10px]">SELESAI</span>
        </div>
      );
    }
    if (statusText === 'PROSES') {
      return (
        <div className="mt-2 flex items-center justify-center gap-1 bg-amber-100 text-amber-700 border border-amber-300 py-1 px-3 rounded-full font-bold w-fit mx-auto print:border-none print:bg-transparent print:p-0">
          <Loader2 size={12} className="animate-spin text-amber-600" /> <span className="text-[10px]">PROSES KERJA</span>
        </div>
      );
    }
    return <div className="mt-2 text-slate-400 font-medium">Status: _________</div>;
  };

  const roles = [
    { name: '1. DESAINER', index: 0 },
    { name: '2. OP MESIN', index: 1 },
    { name: '3. OP PACKAGING', index: 2 },
    { name: '4. KASIR (AMBIL)', index: 3 }
  ];

  return (
    <div className="min-h-screen bg-slate-200 p-4 sm:p-8 font-sans print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto mb-6 flex justify-end print:hidden">
        <Button onClick={handlePrint} className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg cursor-pointer">
          <Printer className="mr-2 w-4 h-4" /> Cetak SPK Produksi
        </Button>
      </div>

      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none print:max-w-full border-t-8 border-t-amber-500">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xl sm:text-2xl">
              <img src="/logo-invoice.png" alt="SIMKEMAS" className="h-8 w-auto" /> SURAT PERINTAH KERJA (SPK)
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Pusat Layanan Kemasan</p>
          </div>
          <div className="text-right">
            <p className="text-sm sm:text-base font-bold text-slate-800">REF: {transaction.invoice_no}</p>
            <p className="text-xs font-bold text-red-600 mt-0.5">DEADLINE: {formatDate(transaction.deadline)}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">NAMA UMKM / PEMESAN</span>
            <span className="font-bold text-slate-800 text-base">{transaction.umkm_name}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">KONTAK WHATSAPP</span>
            <span className="font-bold text-slate-800 text-base">{transaction.phone}</span>
          </div>
        </div>

        <h3 className="font-bold text-slate-800 text-sm mb-3 border-b pb-1">SPESIFIKASI PROSEDUR CETAK & PACKAGING</h3>

        <div className="space-y-6 mb-8">
          {items.map((item, idx) => {
            let legalitasObj = { nibNo: '', pirtNo: '', halalNo: '' };
            try {
              if (item.legalitas) {
                legalitasObj = typeof item.legalitas === 'string' ? JSON.parse(item.legalitas) : item.legalitas;
              }
            } catch (e) {
              console.error(e);
            }

            // 🚀 Sinkronisasi Variabel Data
            const nama = item.nama_kemasan || item.nama || '-';
            const merek = item.merek_kemasan || item.merek || '-';
            const jenis = item.jenis_kemasan || item.jenis || '-';

            return (
              <div key={item.id} className="p-4 border-2 border-slate-200 rounded-lg space-y-3 bg-white">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-xs font-bold text-amber-600">ITEM #{idx + 1}</span>
                    <h4 className="font-black text-lg text-slate-900 leading-tight mt-0.5">{nama}</h4>
                  </div>
                  <span className="font-black text-lg bg-slate-800 text-white px-3 py-1 rounded-md shrink-0">
                    {item.qty} PCS
                  </span>
                </div>

                {/* 🚀 Mengubah grid jadi 2 kolom (Tanpa Label) */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div><span className="text-slate-500 block mb-0.5">Merek:</span><b className="text-slate-800">{merek}</b></div>
                  <div><span className="text-slate-500 block mb-0.5">Jenis Kemasan:</span><b className="text-slate-800">{jenis}</b></div>
                </div>

                {(legalitasObj.nibNo || legalitasObj.pirtNo || legalitasObj.halalNo) && (
                  <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded text-xs space-y-1">
                    <span className="font-bold text-amber-900 block mb-1">Cetak No. Legalitas Pada Kemasan:</span>
                    {legalitasObj.nibNo && <div>NIB: <b className="text-slate-800">{legalitasObj.nibNo}</b></div>}
                    {legalitasObj.pirtNo && <div>PIRT: <b className="text-slate-800">{legalitasObj.pirtNo}</b></div>}
                    {legalitasObj.halalNo && <div>HALAL: <b className="text-slate-800">{legalitasObj.halalNo}</b></div>}
                  </div>
                )}

                {item.catatan && (
                  <div className="p-2.5 bg-slate-50 rounded text-xs border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Catatan Khusus Desain / Cetak:</span>
                    <p className="text-slate-800 italic leading-relaxed">{item.catatan}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Checkpoint Serah Terima Antar Divisi Dinamis */}
        <div className="grid grid-cols-4 gap-4 text-center pt-8 border-t-2 border-slate-800 text-[11px]">
          {roles.map((role) => {
            const roleStatus = getStatus(role.index);
            return (
              <div key={role.name} className="flex flex-col items-center justify-end space-y-8">
                <span className="font-bold text-slate-800">{role.name}</span>
                <div className="relative w-3/4 mx-auto">
                  <div className="border-b border-dashed border-slate-400 w-full"></div>
                  {/* Stempel Centang Melayang jika Selesai */}
                  {roleStatus === 'APPROVED' && (
                    <CheckCircle2 size={30} strokeWidth={2.5} className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-emerald-500 opacity-60 print:opacity-100" />
                  )}
                </div>
                {renderBadge(roleStatus)}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}