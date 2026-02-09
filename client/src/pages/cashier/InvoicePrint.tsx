import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { orderService } from '@/services/order.service';
import { Loader2, Printer, Scissors } from 'lucide-react';

export default function InvoicePrint() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      orderService.getOrderById(id).then(res => setData(res.order));
    }
  }, [id]);

  // LOGIKA HITUNGAN KEUANGAN (REAL-TIME)
  const finance = useMemo(() => {
    if (!data) return null;

    // Total Harga Barang (Sebelum Diskon Awal)
    const subtotal = data.items.reduce((acc: number, item: any) => acc + item.subtotal, 0);
    
    // Diskon Awal (saat order dibuat)
    const initialDiscount = data.discount || 0;
    
    // Total Tagihan Awal (yang tercatat di order)
    const totalAmount = data.total_amount; 

    // Potongan Tambahan (Adjustment saat pickup/kasir)
    const adjustment = data.final_adjustment || 0;

    // Total Akhir yang harus dibayar pelanggan
    const grandTotal = totalAmount - adjustment;

    // Yang sudah dibayar
    const paid = data.paid_amount || 0;

    // Sisa
    // Toleransi 100 rupiah untuk pembulatan
    const remaining = (grandTotal - paid) > 100 ? (grandTotal - paid) : 0;
    
    // Status Lunas (Cek flag dari DB atau hitungan matematika)
    const isPaid = data.payment_status === 'paid' || remaining === 0;

    return { subtotal, initialDiscount, totalAmount, adjustment, grandTotal, paid, remaining, isPaid };
  }, [data]);

  if (!data || !finance) return <div className="loading-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <style>{`
        /* --- RESET & BASIC --- */
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #525659; }
        
        /* --- PAGE SETUP (COMPACT / HEMAT KERTAS) --- */
        .page {
          width: 210mm; /* Lebar A4 */
          height: auto; /* Tinggi menyesuaikan konten (Hemat Kertas) */
          min-height: 140mm; /* Minimal setengah A4 (A5 Landscape) */
          padding: 10mm;
          margin: 20px auto;
          background: white;
          position: relative;
          font-size: 11px; /* Font Base Lebih Kecil */
          color: #333;
        }

        /* --- TYPOGRAPHY & UTILS --- */
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .text-sm { font-size: 10px; }
        .uppercase { text-transform: uppercase; }
        
        /* Header */
        .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
        h1 { margin: 0; font-size: 20px; color: #0f172a; font-weight: 800; letter-spacing: 0.5px; }
        .company-name { font-size: 12px; font-weight: bold; color: #2563eb; }
        .company-info { font-size: 9px; color: #64748b; line-height: 1.3; }

        /* Customer Info Grid */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
        .info-box .label { font-size: 8px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-box .value { font-size: 11px; font-weight: 600; color: #0f172a; }

        /* Table Compact */
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { text-align: left; padding: 6px 4px; background-color: #f1f5f9; font-size: 9px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1; }
        td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .item-name { font-weight: 600; font-size: 11px; }
        .item-meta { font-size: 9px; color: #64748b; }
        
        /* Financial Summary */
        .summary-section { display: flex; justify-content: flex-end; }
        .summary-box { width: 50%; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px; }
        .row.total { font-size: 14px; font-weight: 800; border-top: 1px dashed #94a3b8; padding-top: 6px; margin-top: 6px; }
        .row.paid { color: #166534; font-weight: 600; }
        .row.unpaid { color: #dc2626; font-weight: 600; }

        /* Status Stamp */
        .stamp {
          position: absolute; top: 150px; right: 40px;
          border: 3px double; padding: 5px 15px;
          font-size: 20px; font-weight: 900; text-transform: uppercase;
          transform: rotate(-15deg); opacity: 0.2;
        }
        .stamp.paid { color: #166534; border-color: #166534; }
        .stamp.unpaid { color: #dc2626; border-color: #dc2626; }

        /* Footer */
        .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; paddingTop: 10px; text-align: center; font-size: 9px; color: #94a3b8; }
        
        /* Print Button */
        .fab-print { position: fixed; bottom: 30px; right: 30px; width: 50px; height: 50px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; }

        /* PRINT MEDIA QUERY */
        @media print {
          @page { margin: 0; size: auto; }
          body { background: none; }
          .page { margin: 0; border: none; width: 100%; box-shadow: none; }
          .fab-print { display: none; }
        }
      `}</style>

      <div className="page">
        {/* STAMP WATERMARK */}
        <div className={`stamp ${finance.isPaid ? 'paid' : 'unpaid'}`}>
            {finance.isPaid ? 'LUNAS' : 'BELUM LUNAS'}
        </div>

        {/* HEADER */}
        <div className="header flex justify-between items-end">
          <div>
            <h1>INVOICE</h1>
            <div className="text-sm text-slate-500 font-mono">#{data.code}</div>
          </div>
          <div className="text-right">
            <div className="company-name">PUSAT LAYANAN KEMASAN</div>
            <div className="company-info">
              Kaduagung Tengah, Rangkasbitung<br/>
              WA: 0812-3456-7890
            </div>
          </div>
        </div>

        {/* INFO GRID */}
        <div className="info-grid">
           <div className="info-box">
              <div className="label">Pelanggan</div>
              <div className="value">{data.customer_name}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{data.customer_phone}</div>
           </div>
           <div className="info-box text-right">
              <div className="label">Tanggal / Deadline</div>
              <div className="value">
                 {new Date(data.created_at).toLocaleDateString('id-ID')}
                 {data.deadline && <span style={{ color: '#ef4444' }}> — {new Date(data.deadline).toLocaleDateString('id-ID')}</span>}
              </div>
           </div>
        </div>

        {/* TABEL ITEM */}
        <table>
           <thead>
              <tr>
                 <th style={{ width: '50%' }}>Item</th>
                 <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                 <th style={{ width: '20%', textAlign: 'right' }}>Harga</th>
                 <th style={{ width: '20%', textAlign: 'right' }}>Subtotal</th>
              </tr>
           </thead>
           <tbody>
              {data.items.map((item: any) => (
                 <tr key={item.id}>
                    <td>
                       <div className="item-name">{item.product_name}</div>
                       <div className="item-meta">{item.packaging_type} • {item.packaging_size}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{item.price.toLocaleString('id-ID')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.subtotal.toLocaleString('id-ID')}</td>
                 </tr>
              ))}
           </tbody>
        </table>

        {/* SUMMARY & TOTALS */}
        <div className="summary-section">
           <div className="summary-box">
              
              {/* Hitungan Dasar */}
              <div className="row">
                 <span>Subtotal</span>
                 <span>Rp {finance.subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              {finance.initialDiscount > 0 && (
                 <div className="row" style={{ color: '#ef4444' }}>
                    <span>Diskon</span>
                    <span>- Rp {finance.initialDiscount.toLocaleString('id-ID')}</span>
                 </div>
              )}

              {/* Potongan/Adjustment Kasir (BARU) */}
              {finance.adjustment > 0 && (
                 <div className="row" style={{ color: '#ef4444' }}>
                    <span>Potongan Akhir</span>
                    <span>- Rp {finance.adjustment.toLocaleString('id-ID')}</span>
                 </div>
              )}

              {/* Grand Total */}
              <div className="row total">
                 <span>TOTAL TAGIHAN</span>
                 <span>Rp {finance.grandTotal.toLocaleString('id-ID')}</span>
              </div>

              {/* Status Pembayaran */}
              <div className="row paid" style={{ marginTop: '8px' }}>
                 <span>Sudah Dibayar</span>
                 <span>Rp {finance.paid.toLocaleString('id-ID')}</span>
              </div>

              {!finance.isPaid && (
                 <div className="row unpaid">
                    <span>SISA TAGIHAN</span>
                    <span>Rp {finance.remaining.toLocaleString('id-ID')}</span>
                 </div>
              )}
           </div>
        </div>

        {/* FOOTER */}
        <div className="footer">
           <div className="flex justify-center items-center gap-2 mb-1 opacity-50">
              <Scissors size={10} /> 
              <span style={{ borderBottom: '1px dashed #94a3b8', width: '100%' }}></span>
           </div>
           Terima kasih atas kepercayaan Anda. Barang yang sudah dibeli tidak dapat ditukar kecuali kesalahan produksi.
        </div>
      </div>

      <button onClick={() => window.print()} className="fab-print"><Printer size={20}/></button>
    </>
  );
}