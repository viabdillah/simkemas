import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Search, Shield, 
  Mail, Loader2, AlertCircle, Edit, RotateCcw, XCircle,
  X, Eye, EyeOff, CheckCircle // Import ikon baru
} from 'lucide-react';
import Swal from 'sweetalert2';
import { userService } from '@/services/user.service';
import { toTitleCase } from '@/utils/formatter'; // Pastikan file ini ada

interface UserData {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  deleted_at?: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View Mode: 'active' atau 'trash'
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // State Password Visibility
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '', username: '', email: '', password: '', role: 'operator'
  });

  // 1. Fetch Data
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const isTrash = viewMode === 'trash';
      const res = await userService.getUsers(searchTerm, isTrash);
      setUsers(res.users);
    } catch { 
      Swal.fire('Error', 'Gagal memuat data user', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, viewMode]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 2. Form Input Handlers
  
  // Auto-Capitalize Nama Lengkap
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = toTitleCase(e.target.value);
    setFormData({ ...formData, name: formatted });
  };

  // 3. Modal Actions
  const openAddModal = () => {
    setIsEditMode(false);
    setShowPassword(false);
    setFormData({ name: '', username: '', email: '', password: '', role: 'operator' });
    setShowModal(true);
  };

  const openEditModal = (user: UserData) => {
    setIsEditMode(true);
    setEditId(user.id);
    setShowPassword(false);
    setFormData({ 
      name: user.name, 
      username: user.username, 
      email: user.email, 
      password: '', 
      role: user.role 
    });
    setShowModal(true);
  };

  // 4. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (isEditMode && editId) {
        await userService.updateUser(editId, formData);
        Swal.fire('Berhasil', 'Data user diperbarui', 'success');
      } else {
        await userService.registerUser(formData);
        Swal.fire('Berhasil', 'User baru ditambahkan', 'success');
      }
      
      setShowModal(false);
      fetchUsers();

    } catch (error: any) {
      Swal.fire('Gagal', error.message || 'Terjadi kesalahan', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // 5. CRUD Helpers
  const handleSoftDelete = (id: number, username: string) => {
    Swal.fire({
      title: `Hapus ${username}?`,
      text: "User akan dipindahkan ke Sampah (Soft Delete).",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await userService.deleteUser(id);
          Swal.fire('Terhapus!', 'User dipindahkan ke sampah.', 'success');
          fetchUsers();
        } catch {
          Swal.fire('Gagal', 'Gagal menghapus user', 'error');
        }
      }
    });
  };

  const handleRestore = async (id: number, username: string) => {
    try {
      await userService.restoreUser(id);
      Swal.fire('Dipulihkan', `User ${username} aktif kembali.`, 'success');
      fetchUsers();
    } catch {
      Swal.fire('Gagal', 'Gagal memulihkan user', 'error');
    }
  };

  const handlePermanentDelete = (id: number, username: string) => {
    Swal.fire({
      title: `Hapus PERMANEN ${username}?`,
      text: "Data akan hilang selamanya dan tidak bisa kembali!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'MUSNAHKAN',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await userService.permanentDeleteUser(id);
          Swal.fire('Musnah!', 'User dihapus permanen.', 'success');
          fetchUsers();
        } catch {
          Swal.fire('Gagal', 'Gagal menghapus permanen', 'error');
        }
      }
    });
  };

  // Filter & UI Helpers
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      manajer: 'bg-pink-100 text-pink-700 border-pink-200',
      kasir: 'bg-blue-100 text-blue-700 border-blue-200',
      desainer: 'bg-orange-100 text-orange-700 border-orange-200',
      operator: 'bg-green-100 text-green-700 border-green-200',
    };
    return styles[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      
      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen User</h1>
          <p className="text-slate-500 text-sm">Kelola akses dan akun pengguna sistem</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={18} /> Tambah User
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button 
                onClick={() => setViewMode('active')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                User Aktif
            </button>
            <button 
                onClick={() => setViewMode('trash')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${viewMode === 'trash' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Trash2 size={16} /> Sampah
            </button>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs w-full md:max-w-xs">
            <Search className="text-slate-400 ml-2" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama, username, atau role..." 
              className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">User Info</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    {viewMode === 'active' ? 'Tidak ada user aktif.' : 'Sampah kosong.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${viewMode === 'trash' ? 'bg-slate-400' : 'bg-blue-500'}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-semibold ${viewMode === 'trash' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{u.name}</p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(u.role)} uppercase`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                        {viewMode === 'active' 
                            ? `Daftar: ${new Date(u.created_at).toLocaleDateString()}`
                            : <span className="text-red-500">Dihapus: {u.deleted_at ? new Date(u.deleted_at).toLocaleDateString() : '-'}</span>
                        }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {viewMode === 'active' && (
                            <>
                                <button 
                                    onClick={() => openEditModal(u)}
                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    title="Edit User"
                                >
                                    <Edit size={18} />
                                </button>
                                {u.role !== 'admin' && (
                                    <button 
                                        onClick={() => handleSoftDelete(u.id, u.username)}
                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Hapus (Soft Delete)"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </>
                        )}

                        {viewMode === 'trash' && (
                            <>
                                <button 
                                    onClick={() => handleRestore(u.id, u.username)}
                                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                    title="Pulihkan (Restore)"
                                >
                                    <RotateCcw size={18} />
                                </button>
                                <button 
                                    onClick={() => handlePermanentDelete(u.id, u.username)}
                                    className="p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 rounded-lg transition-colors border border-slate-200"
                                    title="Hapus Permanen"
                                >
                                    <XCircle size={18} />
                                </button>
                            </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL FORM (REVISI BESAR) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          
          {/* Container Modal (Lebih Lebar: max-w-2xl) */}
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="text-blue-600 fill-blue-100" /> 
                  {isEditMode ? 'Edit Data User' : 'Tambah User Baru'}
                </h2>
                <p className="text-slate-500 text-xs mt-1">Lengkapi form di bawah ini dengan benar.</p>
              </div>
              
              {/* TOMBOL TUTUP: Menggunakan icon X (bukan sampah) */}
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-8 overflow-y-auto">
              <form id="userForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Row 1: Nama & Username */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium" 
                      placeholder="Contoh: Budi Santoso" 
                      value={formData.name} 
                      onChange={handleNameChange} // Auto Formatter Title Case
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username</label>
                    <input 
                      required={!isEditMode} 
                      disabled={isEditMode} 
                      type="text" 
                      className={`w-full p-3.5 rounded-xl border border-slate-200 outline-none transition-all font-medium ${isEditMode ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white'}`} 
                      placeholder="tanpa spasi" 
                      value={formData.username} 
                      onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} 
                    />
                  </div>
                </div>

                {/* Row 2: Email */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alamat Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                      required 
                      type="email" 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                      placeholder="email@perusahaan.com" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Row 3: Password & Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Password + Toggle Eye */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {isEditMode ? 'Ganti Password (Opsional)' : 'Password'}
                    </label>
                    <div className="relative group">
                      <input 
                        required={!isEditMode} 
                        type={showPassword ? "text" : "password"} 
                        className="w-full p-3.5 pr-12 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium" 
                        placeholder={isEditMode ? "Kosongkan jika tetap" : "******"} 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                        title={showPassword ? "Sembunyikan" : "Lihat"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Role Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role / Jabatan</label>
                    <div className="relative">
                      <select 
                        className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none appearance-none font-medium cursor-pointer"
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})} 
                      >
                        <option value="operator">Operator Produksi</option>
                        <option value="kasir">Kasir (Input Order)</option>
                        <option value="desainer">Desainer Grafis</option>
                        <option value="manajer">Manajer</option>
                        <option value="admin">Admin Sistem</option>
                      </select>
                      {/* Custom Arrow */}
                      <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                disabled={formLoading} 
                onClick={() => document.getElementById('userForm')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                className="flex-1 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                {formLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <CheckCircle size={18} />
                    {isEditMode ? 'Simpan Perubahan' : 'Simpan User'}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}