/**
 * Edge Function: viewer-verify-otp
 * Verifies 6-digit OTP for Viewer login and issues 30-minute Viewer JWT session token.
 * Enforces per-IP rate limits, CAPTCHA verification, and strict CORS.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { createSessionToken } from '../_shared/session.ts';
import {
  getClientIp,
  hashIpWithPepper,
  checkRateLimit,
  verifyTurnstileToken,
  IP_RATE_LIMIT_MAX,
  IP_RATE_LIMIT_WINDOW_SECONDS
} from '../_shared/ratelimit.ts';

const MAX_ATTEMPTS = 3;

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const clientIp = getClientIp(req);

  try {
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const otpPepper = requireEnv('OTP_PEPPER');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const hashedIp = await hashIpWithPepper(clientIp, otpPepper);
    const ipCheck = await checkRateLimit(supabase, `ip:${hashedIp}`, IP_RATE_LIMIT_MAX, IP_RATE_LIMIT_WINDOW_SECONDS);
    if (!ipCheck.allowed) {
      const retryAfter = ipCheck.retryAfterSeconds || IP_RATE_LIMIT_WINDOW_SECONDS;
      return new Response(
        JSON.stringify({
          error: 'Too many attempts from your network. Please wait before retrying.',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter)
          }
        }
      );
    }

    const body = await req.json();
    const { phone, code, turnstileToken } = body;

    if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Security verification required. Please complete the CAPTCHA.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isCaptchaValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isCaptchaValid) {
      return new Response(
        JSON.stringify({ error: 'Security verification failed. Please try again.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phone || typeof phone !== 'string' || !code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Phone number and verification code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const digitsOnly = phone.replace(/\D/g, '');
    let normalizedPhone = digitsOnly;
    if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
      normalizedPhone = '233' + normalizedPhone.substring(1);
    }
    const e164 = '+' + normalizedPhone;

    // Retrieve active OTP record
    const { data: record, error: fetchErr } = await supabase
      .from('phone_verification_codes')
      .select('*')
      .eq('phone', e164)
      .eq('consumed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !record) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code. Please request a new verification code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Verification code has expired. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: 'Too many incorrect attempts. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify hashed OTP
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(code.trim() + ':' + otpPepper);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hashHex !== record.hashed_code) {
      await supabase
        .from('phone_verification_codes')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id);

      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return new Response(
        JSON.stringify({
          error: remaining > 0
            ? `Incorrect code. ${remaining} attempt(s) remaining.`
            : 'Too many incorrect attempts. Please request a new code.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as consumed
    await supabase
      .from('phone_verification_codes')
      .update({ consumed: true })
      .eq('id', record.id);

    // Verify viewer status
    const { data: viewerRecord } = await supabase
      .from('viewers')
      .select('id, applicant_id, active')
      .eq('phone', e164)
      .eq('active', true)
      .maybeSingle();

    if (!viewerRecord) {
      return new Response(
        JSON.stringify({ error: 'Viewer access not found or deactivated for this contact.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwtSecret = requireEnv('SESSION_JWT_SECRET');

    // Issue 30-minute Viewer JWT session token
    const token = await createSessionToken(
      viewerRecord.applicant_id,
      'viewer',
      jwtSecret
    );

    return new Response(
      JSON.stringify({
        token,
        role: 'viewer',
        phone: e164,
        expiresIn: 1800
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
