import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import Navigate
import { 
  Plus, Search, Users, Phone, MapPin, Mail, 
  Edit, Trash2, RotateCcw, X, CheckCircle, Loader2, AlertCircle 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { customerService } from '@/services/customer.service'; // Use Service
import { toTitleCase, formatPhoneNumber, formatAddress } from '@/utils/formatter';

interface Customer {
  id: number;
  code?: string; // Tambahan field code
  name: string;
  phone: string;
  email: string;
  address: string;
  deleted_at?: string;
}

export default function CustomerManagement() {
  const navigate = useNavigate(); // Hook Navigasi

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: ''
  });

  // Fetch Data
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers(searchTerm, viewMode === 'trash');
      setCustomers(res.customers);
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, [searchTerm, viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  // --- HANDLERS (Formatters) ---

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: toTitleCase(e.target.value) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value.toLowerCase() });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, address: formatAddress(e.target.value) });
  };

  // --- ACTIONS ---

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const openEditModal = (c: Customer) => {
    setIsEditMode(true);
    setEditId(c.id);
    setFormData({ 
      name: c.name, 
      phone: c.phone, 
      email: c.email || '', 
      address: c.address || '' 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isEditMode && editId) {
        await customerService.updateCustomer(editId, formData);
        Swal.fire('Sukses', 'Data pelanggan diperbarui', 'success');
      } else {
        await customerService.createCustomer(formData);
        Swal.fire('Sukses', 'Pelanggan baru terdaftar', 'success');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      Swal.fire('Gagal', err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: 'Hapus Pelanggan?',
      text: 'Data akan dipindahkan ke sampah',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus'
    }).then(async (res) => {
      if (res.isConfirmed) {
        await customerService.deleteCustomer(id);
        fetchCustomers();
      }
    });
  };

  const handleRestore = async (id: number) => {
    await customerService.restoreCustomer(id);
    Swal.fire('Dipulihkan', 'Pelanggan aktif kembali', 'success');
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Pelanggan</h1>
          <p className="text-slate-500 text-sm">Database pelanggan untuk proses pesanan</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95">
          <Plus size={18} /> Pelanggan Baru
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button onClick={() => setViewMode('active')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Aktif</button>
          <button onClick={() => setViewMode('trash')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'trash' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Sampah</button>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama / no WA..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-slate-400 flex flex-col items-center">
          <AlertCircle size={48} className="mb-2 opacity-50" />
          <p>Belum ada data pelanggan ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div 
              key={c.id} 
              // 1. NAVIGASI SAAT KLIK KARTU
              onClick={() => navigate(`/customers/${c.id}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative cursor-pointer active:scale-[0.98]"
            >
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className={`font-bold text-slate-800 truncate ${viewMode === 'trash' ? 'line-through text-slate-400' : ''}`}>{c.name}</h3>
                    {/* Tampilkan Code ID (CST-...) */}
                    <p className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                      {c.code || `ID: #${c.id}`}
                    </p>
                  </div>
                </div>

                {/* Actions Button */}
                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  {viewMode === 'active' ? (
                    <>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); // 2. CEGAH KLIK KARTU (Stop Propagation)
                          openEditModal(c); 
                        }} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); // 2. CEGAH KLIK KARTU
                          handleDelete(c.id); 
                        }} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(c.id);
                      }} 
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Pulihkan"
                    >
                      <RotateCcw size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="font-medium">{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{c.address || '-'}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 relative">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-blue-600" /> {isEditMode ? 'Edit Pelanggan' : 'Pelanggan Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="Nama Pelanggan" value={formData.name} onChange={handleNameChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp / HP</label>
                  <input required type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                    placeholder="0812..." value={formData.phone} onChange={handlePhoneChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email (Opsional)</label>
                  <input type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="email@..." value={formData.email} onChange={handleEmailChange} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Alamat Lengkap</label>
                <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                  placeholder="Nama Jalan, Blok, Kota..." value={formData.address} onChange={handleAddressChange}></textarea>
                <p className="text-[10px] text-slate-400 text-right">Format otomatis setelah titik (.)</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Batal</button>
                <button disabled={formLoading} type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex justify-center items-center gap-2">
                  {formLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Simpan</>}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}