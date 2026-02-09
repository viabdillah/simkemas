// client/src/utils/formatter.ts

/**
 * Mengubah string menjadi Title Case (Huruf Besar di Awal Kata)
 */
export const toTitleCase = (str: string): string => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Formatter untuk No HP / WhatsApp
 * - Menghapus karakter selain angka
 * - Memastikan format bersih (bisa disesuaikan jika ingin paksa 62)
 */
export const formatPhoneNumber = (str: string): string => {
  // Hanya ambil angka
  const cleaned = str.replace(/\D/g, '');
  return cleaned;
};

/**
 * Formatter Alamat (Sentence Case + After Dot)
 * - Huruf pertama kapital
 * - Huruf setelah tanda titik (.) dan spasi akan kapital
 */
export const formatAddress = (str: string): string => {
  // 1. Ubah huruf pertama jadi kapital
  let formatted = str.charAt(0).toUpperCase() + str.slice(1);
  
  // 2. Regex: Cari Tanda Titik diikuti Spasi, lalu Huruf
  formatted = formatted.replace(/(\.\s+)([a-z])/g, (separator, char) => {
    return separator + char.toUpperCase();
  });

  return formatted;
};