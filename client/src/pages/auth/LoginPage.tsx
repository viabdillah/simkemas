import { useState } from 'react';
import { Package, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { authService } from '@/services/auth.service';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validasi manual sederhana
      if (!form.username || !form.password) throw new Error("Username dan password wajib diisi");

      const res = await authService.login(form);

      // Simpan Token
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      // Notifikasi Sukses
      Swal.fire({
        icon: 'success',
        title: 'Login Berhasil!',
        text: `Selamat datang kembali, ${res.user.name}`,
        timer: 1500,
        showConfirmButton: false,
        background: '#fff',
        color: '#333'
      });

      // Redirect (Untuk sementara refresh dulu)
      setTimeout(() => {
        window.location.href = '/dashboard'; 
      }, 1500);

    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Masuk',
        text: error.message,
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      
      {/* Background Ornament (Neon Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl mb-4 shadow-sm border border-blue-100">
            <Package className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SIMKEMAS
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Masuk untuk mengelola sistem</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Masukkan username"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-medium text-slate-700"
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="password" 
                placeholder="Masukkan password"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-medium text-slate-700"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          {/* Button */}
          <button 
            disabled={loading}
            className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Masuk Sistem <ArrowRight size={20} /></>}
          </button>

        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; 2026 SIMKEMAS. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}