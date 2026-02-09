// server/src/utils/generator.ts

export const generateCode = (prefix: string, name: string): string => {
  // Ambil kata pertama dari nama, bersihkan simbol, ambil max 5 huruf
  const cleanName = name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 5);
  
  // Generate 4 karakter acak (Angka & Huruf)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}-${cleanName}-${random}`;
};

export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  // Random 4 digit angka
  const random = Math.floor(1000 + Math.random() * 9000);
  
  return `INV/${yyyy}${mm}${dd}/${random}`;
};