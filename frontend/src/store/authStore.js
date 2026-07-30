import { create } from 'zustand';
import { toast } from 'sonner';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false, // Flag penanda apakah pengecekan awal sudah selesai
  error: null,

  // Action untuk ngecek sesi setiap kali aplikasi di-refresh
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();

      if (response.ok && result.ok) {
        set({ user: result.data.user, error: null });
      } else {
        set({ user: null }); // Token tidak valid / kedaluwarsa
      }
    } catch (err) {
      console.error("Cek Sesi Gagal:", err.message);
      set({ user: null });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    const toastId = toast.loading("Memeriksa kredensial...");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) throw new Error(result.error || "Gagal melakukan login");

      set({ user: result.data.user, error: null });
      toast.success(`Selamat datang, ${result.data.user.username}!`, { id: toastId });
    } catch (err) {
      set({ error: err.message || "Gagal terhubung ke server" });
      toast.error("Login Gagal", { id: toastId, description: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, error: null });
    toast.info("Anda telah keluar dari sistem");
  }
}));