/**
 * OTP Generation, HMAC-SHA-256 Hashing and Constant-time comparison
 */

/**
 * Generates an unpredictable 6-digit numeric OTP code using crypto.getRandomValues
 */
export function generateCryptographicOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // Guarantee 6 digits: 100000 - 999999
  const code = (100000 + (buf[0] % 900000)).toString();
  return code;
}

/**
 * Computes HMAC-SHA-256 of code using OTP_PEPPER
 */
export async function hashOtpCode(code: string, pepper: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(pepper);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(code)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
