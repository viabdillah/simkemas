/**
 * Utilitas Hashing Password Standar OWASP (PBKDF2)
 * @param {string} password - Password dari input user
 * @param {string|null} saltHex - Salt dari database (jika login), atau null (jika register)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPassword(password, saltHex = null) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  let salt;
  if (saltHex) {
    // Convert hex string dari database kembali ke Uint8Array
    salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  } else {
    // Generate 16 byte salt acak untuk user baru
    salt = crypto.getRandomValues(new Uint8Array(16));
  }

  // Derive kunci sebesar 32 byte dengan 210.000 iterasi
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 210000,
      hash: "SHA-256",
    },
    passwordKey,
    32 * 8
  );

  // Convert buffer hasil ke format hex string agar mudah disimpan di DB (TEXT)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const newSaltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return { hash: hashHex, salt: newSaltHex };
}