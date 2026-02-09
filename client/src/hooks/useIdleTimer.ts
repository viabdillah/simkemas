import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// 25 Menit (dalam milidetik)
const IDLE_TIMEOUT = 25 * 60 * 1000;

export const useIdleTimer = () => {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  // 1. Gunakan useCallback agar fungsi ini stabil dan tidak dibuat ulang tiap render
  const logoutUser = useCallback(() => {
    // Hapus Data Sesi
    localStorage.clear();
    
    // Tutup semua modal/alert
    Swal.close();

    // Percobaan Menutup Tab Browser
    try {
      window.close();
    } catch { 
      // FIX ERROR 1: Hapus '(e)' jika tidak dipakai, atau ganti jadi '(_)'
      console.warn("Browser memblokir penutupan otomatis tab.");
    }

    // Fallback Keamanan
    navigate('/login', { replace: true });

    Swal.fire({
      icon: 'warning',
      title: 'Sesi Berakhir',
      text: 'Sistem logout otomatis (25 menit tanpa aktivitas).',
      timer: 4000,
      showConfirmButton: false,
      allowOutsideClick: false
    });
  }, [navigate]); // Dependency navigate aman (stabil)

  // 2. Gunakan useCallback juga disini
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Set timer baru
    timerRef.current = window.setTimeout(logoutUser, IDLE_TIMEOUT);
  }, [logoutUser]); // Dependency ke logoutUser (yang sudah stabil karena useCallback diatas)

  useEffect(() => {
    // Daftar event
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Pasang listener
    const handleEvent = () => resetTimer();
    
    events.forEach(event => {
      window.addEventListener(event, handleEvent);
    });

    // Jalankan timer pertama kali
    resetTimer();

    // Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };
    // FIX ERROR 2: Sekarang aman memasukkan resetTimer ke dependency
  }, [resetTimer]); 
};