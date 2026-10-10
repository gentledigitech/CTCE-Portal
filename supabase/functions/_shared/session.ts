/**
 * Short-lived (30 minutes) Applicant & Viewer Session JWT tokens
 */

import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

export async function createSessionToken(
  applicantId: string,
  role: 'applicant' | 'viewer',
  secretKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  return await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      sub: applicantId,
      role,
      exp: getNumericDate(30 * 60) // 30 minutes expiry
    },
    key
  );
}

export async function verifySessionToken(
  token: string,
  secretKey: string
): Promise<{ applicantId: string; role: string } | null> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const payload = await verify(token, key);
    if (!payload.sub || !payload.role) return null;
    return { applicantId: payload.sub as string, role: payload.role as string };
  } catch {
    return null;
  }
}
