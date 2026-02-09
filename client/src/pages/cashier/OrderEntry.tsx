import { useState, useEffect, useMemo } from 'react';
// Hapus useNavigate jika tidak dipakai untuk menghindari warning ESLint
import { 
  Search, ShoppingCart, Plus, Trash2, Save, 
  User, Package, AlertCircle, X, ChevronRight, Loader2,
  FileCheck, FileX, AlignLeft,
  Calendar, CreditCard, Tag 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { customerService } from '@/services/customer.service';
import { productService } from '@/services/product.service';
import { orderService } from '@/services/order.service';
import { packagingService } from '@/services/packaging.service';

interface CartItem {
  tempId: number;
  product_id: number;
  product_name: string;
  variant: string;
  quantity: number;
  price: number;
  subtotal: number;
  note: string;
  has_design: boolean;
}

export default function OrderEntry() {
  // --- STATE: CUSTOMER & PRODUCT ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [packagings, setPackagings] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  
  // --- STATE: FORM INPUT ITEM ---
  const [itemForm, setItemForm] = useState({ 
    variant: '', 
    quantity: 1, 
    price: 0,
    note: '',
    has_design: true
  });

  // --- STATE: CART & TRANSACTION ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // --- STATE: PAYMENT & DISCOUNT ---
  const [deadline, setDeadline] = useState('');
  const [paymentOption, setPaymentOption] = useState<'full' | 'dp' | 'later' | null>(null);
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // --- FETCHERS ---
  
  useEffect(() => {
    packagingService.getAll().then(res => setPackagings(res.packagings));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (isCustomerModalOpen) {
        const res = await customerService.getCustomers(customerSearch);
        setCustomers(res.customers);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [customerSearch, isCustomerModalOpen]);

  useEffect(() => {
    if (selectedCustomer) {
      productService.getByCustomer(selectedCustomer.id).then(res => {
        setProducts(res.products);
      });
    } else {
      setProducts([]);
      setCart([]);
      setPaymentOption(null);
    }
  }, [selectedCustomer]);

  // --- LOGIC HANDLERS ---

  const handleSelectCustomer = (c: any) => {
    if (cart.length > 0) {
      Swal.fire({
        title: 'Ganti Pelanggan?',
        text: 'Keranjang saat ini akan dikosongkan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Ganti',
      }).then((result) => {
        if (result.isConfirmed) {
          setSelectedCustomer(c);
          setCart([]);
          setCustomerModalOpen(false);
        }
      });
    } else {
      setSelectedCustomer(c);
      setCustomerModalOpen(false);
    }
  };

  const openProductModal = (prod: any) => {
    setSelectedProduct(prod);

    // LOGIKA AUTO PRICE
    let autoPrice = 0;
    const type = packagings.find(p => p.name === prod.packaging_type);
    if (type) {
        const size = type.sizes.find((s: any) => s.size === prod.packaging_size);
        if (size) autoPrice = size.price;
    }

    setItemForm({
      variant: prod.variants.length > 0 ? prod.variants[0] : '-',
      quantity: 1,
      price: autoPrice,
      note: '',
      has_design: true
    });
    setProductModalOpen(true);
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    // --- VALIDASI DUPLIKAT (BARU) ---
    // Cek apakah ada item dengan ID Produk DAN Varian yang sama
    const isDuplicate = cart.some(item => 
        item.product_id === selectedProduct.id && 
        item.variant === itemForm.variant
    );

    if (isDuplicate) {
        Swal.fire({
            icon: 'warning',
            title: 'Item Sudah Ada!',
            text: `Produk "${selectedProduct.name}" dengan varian "${itemForm.variant}" sudah ada di keranjang. Silakan hapus item di keranjang jika ingin mengubahnya.`,
            confirmButtonColor: '#f59e0b'
        });
        return; // Stop, jangan tambahkan ke cart
    }
    // --------------------------------

    if (itemForm.quantity < 1) return Swal.fire('Error', 'Jumlah minimal 1', 'error');
    if (itemForm.price < 0) return Swal.fire('Error', 'Harga tidak boleh minus', 'error');

    const newItem: CartItem = {
      tempId: Date.now(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      variant: itemForm.variant,
      quantity: Number(itemForm.quantity),
      price: Number(itemForm.price),
      subtotal: Number(itemForm.quantity) * Number(itemForm.price),
      note: itemForm.note,
      has_design: itemForm.has_design
    };

    setCart([...cart, newItem]);
    setProductModalOpen(false);
    
    const Toast = Swal.mixin({
      toast: true, position: 'top-end', showConfirmButton: false, timer: 1500
    });
    Toast.fire({ icon: 'success', title: 'Masuk Keranjang' });
  };

  const removeFromCart = (tempId: number) => {
    setCart(cart.filter(item => item.tempId !== tempId));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    const total = subtotal - discount;
    return total < 0 ? 0 : total;
  }, [subtotal, discount]);

  const resetForm = () => {
    setSelectedCustomer(null);
    setCart([]);
    setNote('');
    setDeadline('');
    setPaymentOption(null);
    setDpAmount(0);
    setDiscount(0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedCustomer) return Swal.fire('Error', 'Pilih pelanggan dulu', 'error');
    if (cart.length === 0) return Swal.fire('Error', 'Keranjang kosong', 'error');
    if (!paymentOption) return Swal.fire('Error', 'Mohon pilih opsi pembayaran', 'error');

    setLoading(true);
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        note: note,
        deadline: deadline,
        payment_option: paymentOption,
        paid_amount: dpAmount,
        discount: discount,
        items: cart.map(item => ({
          product_id: item.product_id,
          variant: item.variant,
          quantity: item.quantity,
          price: item.price,
          note: item.note,
          has_design: item.has_design
        }))
      };

      const res = await orderService.createOrder(payload);
      
      Swal.fire({
        icon: 'success',
        title: 'Pesanan Berhasil!',
        text: `Faktur ${res.code} telah dibuat.`,
        showCancelButton: true,
        confirmButtonText: '🖨️ Cetak Invoice',
        cancelButtonText: 'Pesanan Baru',
        confirmButtonColor: '#2563eb'
      }).then((result) => {
        if (result.isConfirmed) {
            window.open(`/invoice/${res.orderId}`, '_blank');
            resetForm();
        } else {
            resetForm();
        }
      });
      
    } catch (error: any) {
      Swal.fire('Gagal', error.message || 'Transaksi gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] gap-6 lg:overflow-hidden pb-24 lg:pb-0">
      
      {/* --- BAGIAN KIRI: List Produk --- */}
      <div className="flex-1 flex flex-col gap-6 lg:overflow-y-auto lg:pr-2">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Pesanan Baru</h1>
          {!selectedCustomer ? (
            <button onClick={() => setCustomerModalOpen(true)} className="w-full py-4 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
              <User size={32} /> <span className="font-bold">Pilih Pelanggan Terlebih Dahulu</span>
            </button>
          ) : (
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">{selectedCustomer.name.charAt(0)}</div>
                <div><h3 className="font-bold text-slate-800">{selectedCustomer.name}</h3><p className="text-sm text-slate-500 font-mono">{selectedCustomer.code}</p></div>
              </div>
              <button onClick={() => setCustomerModalOpen(true)} className="text-sm text-blue-600 font-bold hover:underline">Ganti</button>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Daftar Produk {selectedCustomer ? `(${products.length})` : ''}</h2>
          {!selectedCustomer ? (
            <div className="h-40 lg:h-64 flex flex-col items-center justify-center text-slate-400"><AlertCircle size={48} className="mb-2 opacity-50" /><p>Mohon pilih pelanggan untuk memuat produk.</p></div>
          ) : products.length === 0 ? (
            <div className="h-40 lg:h-64 flex flex-col items-center justify-center text-slate-400"><Package size={48} className="mb-2 opacity-50" /><p>Pelanggan ini belum memiliki produk.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((prod) => (
                <div key={prod.id} onClick={() => openProductModal(prod)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all active:scale-[0.98]">
                  <div className="flex justify-between items-start">
                    <div><h3 className="font-bold text-slate-800">{prod.name}</h3><p className="text-xs text-blue-600 font-medium mb-2">{prod.brand}</p></div>
                    <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500"><ChevronRight size={16} /></div>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{prod.packaging_type} ({prod.packaging_size})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- BAGIAN KANAN: Keranjang & Pembayaran --- */}
      <div className="w-full lg:w-100 bg-white border border-slate-200 shadow-xl rounded-3xl flex flex-col lg:shrink-0 lg:h-full">
        <div className="p-5 border-b border-slate-100 bg-slate-50 rounded-t-3xl flex justify-between items-center">
          <div className="flex items-center gap-2"><ShoppingCart className="text-blue-600" /><h2 className="font-bold text-slate-800">Keranjang</h2></div>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{cart.length} Item</span>
        </div>

        <div className="lg:flex-1 lg:overflow-y-auto p-4 space-y-3 min-h-37.5 lg:min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 py-8 lg:py-0"><ShoppingCart size={64} className="mb-4" /><p>Keranjang kosong</p></div>
          ) : (
            cart.map((item) => (
              <div key={item.tempId} className="flex flex-col p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.product_name}</h4>
                        <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">{item.variant}</span>
                            {item.has_design ? <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100"><FileCheck size={10} /> Ada Desain</span> : <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"><FileX size={10} /> Belum Desain</span>}
                        </div>
                    </div>
                    <button onClick={() => removeFromCart(item.tempId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                </div>
                {item.note && <div className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-100">"{item.note}"</div>}
                <div className="flex justify-between items-end border-t border-slate-100 pt-2 mt-1">
                    <div className="text-xs text-slate-400">{item.quantity} x Rp {item.price.toLocaleString()}</div>
                    <span className="font-bold text-slate-800">Rp {item.subtotal.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl space-y-4">
          
          <div className="flex items-center justify-between gap-4">
               <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Tag size={12} /> Diskon (Rp)</div>
               <input type="number" min="0" className="w-32 p-2 bg-white border border-slate-200 rounded-lg text-sm text-right font-bold text-red-500 outline-none focus:ring-2 focus:ring-red-200" placeholder="0" value={discount > 0 ? discount : ''} onChange={(e) => setDiscount(Number(e.target.value))} />
          </div>
          <div className="h-px bg-slate-200 my-2"></div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={12} /> Deadline Produksi</label>
            <input type="date" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><CreditCard size={12} /> Pembayaran</label>
             <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setPaymentOption('full')} className={`p-2 rounded-lg text-xs font-bold border transition-all ${paymentOption === 'full' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Lunas</button>
                <button onClick={() => { setPaymentOption('dp'); setDpAmount(grandTotal * 0.5); }} className={`p-2 rounded-lg text-xs font-bold border transition-all ${paymentOption === 'dp' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>DP</button>
                <button onClick={() => setPaymentOption('later')} className={`p-2 rounded-lg text-xs font-bold border transition-all ${paymentOption === 'later' ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Nanti</button>
             </div>
          </div>

          {paymentOption === 'dp' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Nominal DP:</span><span className="text-orange-600 font-bold">Sisa: Rp {(grandTotal - dpAmount).toLocaleString()}</span></div>
                 <input type="number" className="w-full p-2.5 bg-white border border-orange-200 focus:border-orange-500 rounded-xl text-sm font-bold text-orange-600 outline-none" value={dpAmount} onChange={(e) => setDpAmount(Number(e.target.value))} />
              </div>
          )}
          
          <textarea placeholder="Catatan umum transaksi..." className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-14 resize-none" value={note} onChange={(e) => setNote(e.target.value)}></textarea>

          <div className="pt-2 border-t border-slate-200">
             <div className="flex justify-between items-center mb-4"><span className="text-sm font-medium text-slate-500">Total Tagihan</span><span className="text-xl font-black text-slate-800">Rp {grandTotal.toLocaleString()}</span></div>
             <button onClick={handleSubmitOrder} disabled={loading || cart.length === 0 || !paymentOption} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Proses Pesanan</>}
             </button>
          </div>
        </div>
      </div>

      {/* Modal Customers */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Pilih Pelanggan</h3><button onClick={() => setCustomerModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18} /></button></div>
            <div className="p-4 border-b border-slate-100"><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input autoFocus type="text" placeholder="Cari nama..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} /></div></div>
            <div className="flex-1 overflow-y-auto p-2">
              {customers.map(c => (
                <div key={c.id} onClick={() => handleSelectCustomer(c)} className="p-3 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{c.name.charAt(0)}</div>
                  <div><h4 className="font-bold text-slate-800">{c.name}</h4><p className="text-xs text-slate-500">{c.phone}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Items */}
      {isProductModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] relative">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div><h3 className="font-bold text-lg text-slate-800">{selectedProduct.name}</h3><p className="text-sm text-blue-600 font-medium">{selectedProduct.brand}</p></div>
                  <button onClick={() => setProductModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Varian</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.variant} onChange={(e) => setItemForm({...itemForm, variant: e.target.value})}>
                    {selectedProduct.variants.length > 0 ? (selectedProduct.variants.map((v: string) => <option key={v} value={v}>{v}</option>)) : (<option value="-">-</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Jumlah</label>
                      <input type="number" min="1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center" value={itemForm.quantity} onChange={(e) => setItemForm({...itemForm, quantity: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Harga Satuan</label>
                      <input type="number" min="0" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-right" value={itemForm.price} placeholder="Rp" onChange={(e) => setItemForm({...itemForm, price: Number(e.target.value)})} />
                   </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Status Desain</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setItemForm({...itemForm, has_design: true})} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${itemForm.has_design ? 'bg-green-50 border-green-500 text-green-700 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><FileCheck size={18} /> Ada Desain</button>
                        <button type="button" onClick={() => setItemForm({...itemForm, has_design: false})} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${!itemForm.has_design ? 'bg-slate-100 border-slate-400 text-slate-700 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><FileX size={18} /> Belum Ada</button>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><AlignLeft size={12} /> Keterangan Produk (Opsional)</label>
                    <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm" placeholder="Contoh: Warna merahnya agak gelap, tulisan dibesarkan..." value={itemForm.note} onChange={(e) => setItemForm({...itemForm, note: e.target.value})}></textarea>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl shrink-0 space-y-3">
                <div className="flex justify-between items-center text-blue-800 px-1"><span className="text-xs font-bold uppercase">Total Item</span><span className="font-black text-lg">Rp {(itemForm.quantity * itemForm.price).toLocaleString()}</span></div>
                <button onClick={addToCart} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-transform flex justify-center items-center gap-2"><Plus size={20} /> Masukkan Keranjang</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}