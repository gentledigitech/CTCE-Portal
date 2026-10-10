/**
 * Rate Limiting and Cloudflare Turnstile token validation
 * Enforces per-IP and per-phone limits backed by atomic check_rate_limit SQL function.
 * Fails closed if the database check errors.
 */

// ============================================================================
// RATE LIMIT CONFIGURATION CONSTANTS (Easily adjustable)
// ============================================================================
/** Per-IP limit: Maximum OTP SMS sends per IP address per window (first send plus resends) */
export const IP_RATE_LIMIT_MAX = 4;
/** Per-IP window duration: 1 hour in seconds (3600 seconds) */
export const IP_RATE_LIMIT_WINDOW_SECONDS = 3600;

/** Per-Phone limit: Maximum OTP SMS sends per phone number per window */
export const PHONE_RATE_LIMIT_MAX = 3;
/** Per-Phone window duration: 1 hour in seconds (3600 seconds) */
export const PHONE_RATE_LIMIT_WINDOW_SECONDS = 3600;

/** Minimum cooldown duration between consecutive resend requests in seconds */
export const RESEND_COOLDOWN_SECONDS = 60;

// ============================================================================
// IP HASHING WITH OTP_PEPPER (HMAC-SHA-256)
// ============================================================================
/**
 * Hashes client IP with OTP_PEPPER using HMAC-SHA-256 before database storage.
 * Ensures privacy and prevents storing raw IP addresses in the database.
 */
export async function hashIpWithPepper(ip: string, pepper: string): Promise<string> {
  const normalizedIp = (ip || '127.0.0.1').trim();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(pepper || 'fallback-dev-pepper');

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
    encoder.encode(`ip:${normalizedIp}`)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// ATOMIC RATE LIMIT CHECK (FAIL CLOSED ON ERROR)
// ============================================================================
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Checks and increments rate limit using the atomic stored SQL function `check_rate_limit`.
 *
 * CRITICAL SECURITY REQUIREMENT:
 * Fails closed if the database check errors or throws an exception.
 * When failing closed, access is denied (allowed = false) with a conservative Retry-After.
 */
export async function checkRateLimit(
  supabase: any,
  key: string,
  maxAttempts: number = IP_RATE_LIMIT_MAX,
  windowSeconds: number = IP_RATE_LIMIT_WINDOW_SECONDS
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max: maxAttempts,
      p_window_seconds: windowSeconds
    });

    // If RPC returns an error or empty result: FAIL CLOSED
    if (error || !data) {
      console.error(`[RateLimit] RPC check_rate_limit failed for key '${key}'. Failing closed:`, error);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: windowSeconds
      };
    }

    const isAllowed = data.allowed === true;
    const remaining = typeof data.remaining === 'number' ? data.remaining : 0;
    const retryAfter = typeof data.retry_after_seconds === 'number' ? data.retry_after_seconds : 0;

    return {
      allowed: isAllowed,
      remaining,
      retryAfterSeconds: !isAllowed && retryAfter <= 0 ? windowSeconds : retryAfter
    };
  } catch (err: any) {
    // On unexpected exception (e.g. database connection down): FAIL CLOSED
    console.error(`[RateLimit] Unexpected error checking rate limit for key '${key}'. Failing closed:`, err);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: windowSeconds
    };
  }
}

// ============================================================================
// CLOUDFLARE TURNSTILE TOKEN VERIFICATION
// ============================================================================
export async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET');
  if (!secret) return true; // Bypass in local development when TURNSTILE_SECRET is not configured

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: ip
      })
    });
    const outcome = await res.json();
    return outcome.success === true;
  } catch {
    return false;
  }
}
