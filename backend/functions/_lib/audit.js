/**
 * Helper untuk menyisipkan catatan ke tabel audit_logs
 * @param {Object} db - Instance D1 Database Cloudflare
 * @param {String} userId - ID pengguna yang melakukan aksi (dari token)
 * @param {String} action - Nama aksi (contoh: CREATE_USER, UPDATE_ROLE)
 * @param {String} details - Keterangan spesifik tentang aksinya
 * @param {String} ipAddress - IP Address pengguna (jika ada)
 */
export async function insertAuditLog(db, userId, action, details, ipAddress = 'Local') {
  try {
    const id = crypto.randomUUID();
    await db.prepare(
      "INSERT INTO audit_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, userId, action, details, ipAddress).run();
  } catch (error) {
    // Kita tangkap errornya agar kalau gagal nulis log, 
    // tidak membuat proses utama (seperti tambah user) ikutan gagal/crash.
    console.error("Gagal menulis Audit Log:", error);
  }
}