/**
 * Standard API Response & Validation Formatter
 * @param {boolean} ok - Status keberhasilan
 * @param {any} data - Data kembalian (jika sukses)
 * @param {string|null} error - Pesan error (jika gagal)
 * @returns {{ok: boolean, data: any, error: string|null}}
 */
export const formatResponse = (ok, data = null, error = null) => {
  return { ok, data, error };
};

// Daftar Role Valid sesuai arsitektur SIMKEMAS
export const VALID_ROLES = [
  'Super Administrasi',
  'Kasir',
  'Manajer',
  'Desainer',
  'Operator Mesin',
  'Operator Packaging',
  'Tamu'
];

/**
 * Validasi untuk pembuatan pengguna baru
 * @param {Object} data - Payload dari frontend
 * @returns {Object} formatResponse standar { ok, data, error }
 */
export function validateCreateUser(data) {
  const { username, password, role } = data;

  if (!username || username.trim().length < 4) {
    return formatResponse(false, null, "Username minimal 4 karakter");
  }
  
  // Mencegah spasi pada username
  if (/\s/.test(username)) {
    return formatResponse(false, null, "Username tidak boleh mengandung spasi");
  }

  if (!password || password.length < 8) {
    return formatResponse(false, null, "Kata sandi minimal 8 karakter");
  }

  if (!role || !VALID_ROLES.includes(role)) {
    return formatResponse(false, null, "Role pengguna tidak valid");
  }

  return formatResponse(true, { 
    username: username.trim(), 
    password, 
    role 
  });
}