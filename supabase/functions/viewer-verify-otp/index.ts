/**
 * Edge Function: viewer-verify-otp
 * Verifies 6-digit OTP for Viewer login and issues 30-minute Viewer JWT session token.
 * Enforces per-IP rate limits, CAPTCHA verification, and strict CORS.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { hashOtpCode, constantTimeCompare } from '../_shared/otp.ts';
import { createSessionToken } from '../_shared/session.ts';
import { validatePhoneServer } from '../_shared/validate.ts';
import {
  checkRateLimit,
  verifyTurnstileToken,
  hashIpWithPepper,
  IP_RATE_LIMIT_MAX,
  IP_RATE_LIMIT_WINDOW_SECONDS
} from '../_shared/ratelimit.ts';

const MAX_ATTEMPTS = 3;

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const activeCorsHeaders = getCorsHeaders();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const clientIp =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  try {
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const otpPepper = requireEnv('OTP_PEPPER');
    const jwtSecret = requireEnv('SESSION_JWT_SECRET');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. IP-level Rate Limit
    const hashedIp = await hashIpWithPepper(clientIp, otpPepper);
    const ipCheck = await checkRateLimit(supabase, `ip:${hashedIp}`, IP_RATE_LIMIT_MAX, IP_RATE_LIMIT_WINDOW_SECONDS);
    if (!ipCheck.allowed) {
      const retryAfter = ipCheck.retryAfterSeconds > 0 ? ipCheck.retryAfterSeconds : IP_RATE_LIMIT_WINDOW_SECONDS;
      return new Response(
        JSON.stringify({
          error: 'Too many attempts from your network. Please wait before retrying.',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            ...activeCorsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter)
          }
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { phone, code, turnstileToken } = body;

    // 2. Turnstile CAPTCHA check
    if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Security verification required. Please complete the CAPTCHA.' }),
        { status: 400, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isCaptchaValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isCaptchaValid) {
      return new Response(
        JSON.stringify({ error: 'Security verification failed. Please try again.' }),
        { status: 403, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validate Phone
    const phoneValidation = validatePhoneServer(phone);
    if (!phoneValidation.isValid || !phoneValidation.normalized) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format.' }),
        { status: 400, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const phoneE164 = phoneValidation.normalized;

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid 6-digit verification code.' }),
        { status: 400, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Retrieve active OTP record from otp_codes
    const { data: record, error: fetchErr } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_e164', phoneE164)
      .eq('purpose', 'viewer')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !record) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code. Please request a new verification code.' }),
        { status: 400, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment attempts
    const { data: updatedOtp } = await supabase
      .from('otp_codes')
      .update({ attempts: record.attempts + 1 })
      .eq('id', record.id)
      .select('attempts')
      .single();

    if (!updatedOtp || updatedOtp.attempts > MAX_ATTEMPTS) {
      await supabase.from('otp_codes').update({ used: true }).eq('id', record.id);
      return new Response(
        JSON.stringify({ error: 'Too many incorrect attempts. Code is now invalidated.' }),
        { status: 400, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify hashed code in constant time
    const computedHash = await hashOtpCode(code.trim(), otpPepper);
    if (!constantTimeCompare(computedHash, record.code_hash)) {
      const remaining = MAX_ATTEMPTS - updatedOtp.attempts;
      return new Response(
        JSON.stringify({
          error: remaining > 0
            ? `Incorrect code. ${remaining} attempt(s) remaining.`
            : 'Too many incorrect attempts. Please request a new code.'
        }),
        { status: 400, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', record.id);

    // 5. Verify viewer status in applicants + viewers table
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id, full_name, viewers!inner(active)')
      .eq('phone_e164', phoneE164)
      .eq('viewers.active', true)
      .maybeSingle();

    if (!applicant) {
      return new Response(
        JSON.stringify({ error: 'No active Viewer account found registered with this phone number.' }),
        { status: 403, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Issue 30-minute Viewer JWT session token
    const token = await createSessionToken(
      applicant.id,
      'viewer',
      jwtSecret
    );

    return new Response(
      JSON.stringify({
        token,
        role: 'viewer',
        phone: phoneE164,
        expiresIn: 1800
      }),
      { status: 200, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
