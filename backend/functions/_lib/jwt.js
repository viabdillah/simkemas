/**
 * Utilitas penandatanganan JWT (HMAC-SHA256) menggunakan Web Crypto API native
 * Menghindari library pihak ketiga demi performa dan keamanan.
 */

// Helper untuk format Base64Url
function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function signJWT(payload, secret) {
  const encoder = new TextEncoder();
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(dataToSign)
  );
  
  const encodedSignature = base64UrlEncode(signatureBuffer);
  
  return `${dataToSign}.${encodedSignature}`;
}

// Helper untuk men-decode Base64Url kembali ke Uint8Array
function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Utilitas Verifikasi JWT (HMAC-SHA256) menggunakan Web Crypto API
 */
export async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Format token tidak valid');

  const [encodedHeader, encodedPayload, signature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = base64UrlDecode(signature);

  // Verifikasi keaslian signature
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(dataToSign)
  );

  if (!isValid) throw new Error('Signature token tidak valid (Token palsu)');

  // Parsing payload
  const payloadStr = new TextDecoder().decode(base64UrlDecode(encodedPayload));
  const payload = JSON.parse(payloadStr);

  // Cek apakah token sudah expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Sesi telah berakhir (Token kedaluwarsa)');
  }

  return payload;
}