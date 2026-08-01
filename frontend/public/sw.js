// Service worker minimal — cukup untuk memenuhi syarat "installable" PWA.
// Belum melakukan caching agresif, supaya tidak mengganggu development/testing awal.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through sederhana — request tetap ke jaringan seperti biasa.
  // Nanti bisa dikembangkan untuk caching offline jika dibutuhkan.
  event.respondWith(fetch(event.request));
});