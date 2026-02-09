// client/src/services/base.ts
import Swal from 'sweetalert2';

// Ambil URL dari .env
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // --- JEBAKAN 401 (SESSION EXPIRED) ---
    if (response.status === 401) {
      // 1. Cek apakah ini bukan proses login (agar tidak infinite loop)
      if (!endpoint.includes('/auth/login')) {
        
        // 2. Bersihkan Token Basi
        localStorage.clear();

        // 3. Beri tahu user (Opsional, bisa langsung redirect kalau mau cepat)
        await Swal.fire({
          icon: 'warning',
          title: 'Sesi Habis',
          text: 'Silakan login kembali untuk melanjutkan.',
          confirmButtonColor: '#3b82f6',
          timer: 2000
        });

        // 4. Tendang ke Halaman Login
        window.location.href = '/login';
        
        // 5. Hentikan proses
        throw new Error('Session expired');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Terjadi kesalahan pada server');
    }

    return data;

  } catch (error: any) {
    // Jika errornya karena kita yang lempar (Session expired), biarkan
    if (error.message === 'Session expired') throw error;
    
    // Jika fetch gagal total (Server mati / No Internet)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    }

    throw error;
  }
};