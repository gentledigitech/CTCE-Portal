/**
 * Edge Function: request-otp
 * Generates 6-digit OTP, strictly verifies Turnstile token, enforces per-IP (max 4/hr)
 * and per-Phone (max 3/hr) rate limits via atomic check_rate_limit SQL function,
 * and calls Arkesel to send plain SMS.
 * Fails closed if rate limit check or Turnstile check errors.
 * Returns HTTP 429 with Retry-After header on limit breach.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { sendArkeselSms } from '../_shared/sms.ts';
import { generateCryptographicOtp, hashOtpCode } from '../_shared/otp.ts';
import {
  checkRateLimit,
  verifyTurnstileToken,
  hashIpWithPepper,
  IP_RATE_LIMIT_MAX,
  IP_RATE_LIMIT_WINDOW_SECONDS,
  PHONE_RATE_LIMIT_MAX,
  PHONE_RATE_LIMIT_WINDOW_SECONDS,
  RESEND_COOLDOWN_SECONDS
} from '../_shared/ratelimit.ts';
import { validatePhoneServer } from '../_shared/validate.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { phone, fullName, studentId, turnstileToken } = await req.json();

    // Extract client IP address from proxy / gateway headers
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // REQUIRE turnstileToken: MUST NOT be missing, empty or not a string. No skip!
    if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Security verification token (turnstileToken) is required.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify Cloudflare Turnstile token (fails closed on missing secret, network error, or non-OK response)
    const isTurnstileValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isTurnstileValid) {
      return new Response(JSON.stringify({ error: 'Security verification failed.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate and normalize Ghanaian phone number
    const phoneValidation = validatePhoneServer(phone);
    if (!phoneValidation.isValid || !phoneValidation.normalized) {
      return new Response(JSON.stringify({ error: 'Invalid Ghanaian phone number.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const phoneE164 = phoneValidation.normalized;

    // Strictly require environment variables without fallback defaults
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const pepper = requireEnv('OTP_PEPPER');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // =========================================================================
    // 1. ATOMIC PER-IP RATE LIMIT CHECK (RUNS BEFORE ANY ARKESEL CALL)
    // =========================================================================
    // Hash client IP with OTP_PEPPER before storing or checking in rate_limits
    const hashedIp = await hashIpWithPepper(clientIp, pepper);
    const ipRateLimitKey = `ip:${hashedIp}`;

    // Limit of 4 OTP SMS sends per IP per hour (first send plus resends)
    const ipLimit = await checkRateLimit(
      supabase,
      ipRateLimitKey,
      IP_RATE_LIMIT_MAX,
      IP_RATE_LIMIT_WINDOW_SECONDS
    );

    // Fail closed: if check errors or exceeded, return 429 with Retry-After header
    if (!ipLimit.allowed) {
      const retryAfter = ipLimit.retryAfterSeconds > 0 ? ipLimit.retryAfterSeconds : IP_RATE_LIMIT_WINDOW_SECONDS;
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded: Maximum 4 SMS codes per hour per IP. Please wait before requesting another code.',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    // =========================================================================
    // 2. ATOMIC PER-PHONE RATE LIMIT CHECK
    // =========================================================================
    const phoneLimit = await checkRateLimit(
      supabase,
      `phone:${phoneE164}`,
      PHONE_RATE_LIMIT_MAX,
      PHONE_RATE_LIMIT_WINDOW_SECONDS
    );

    if (!phoneLimit.allowed) {
      const retryAfter = phoneLimit.retryAfterSeconds > 0 ? phoneLimit.retryAfterSeconds : PHONE_RATE_LIMIT_WINDOW_SECONDS;
      return new Response(
        JSON.stringify({
          error: 'Too many SMS requests for this phone number. Please try again later.',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    // =========================================================================
    // 3. MINIMUM RESEND COOLDOWN CHECK (60 SECONDS)
    // =========================================================================
    const { data: recentOtp } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('phone_e164', phoneE164)
      .eq('purpose', 'applicant')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const timeSinceLastOtp = Date.now() - new Date(recentOtp.created_at).getTime();
      const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
      if (timeSinceLastOtp < cooldownMs) {
        const remainingCooldown = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
        return new Response(
          JSON.stringify({
            error: `Please wait ${remainingCooldown}s before requesting a new code.`,
            retryAfter: remainingCooldown
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': remainingCooldown.toString()
            }
          }
        );
      }
    }

    // Upsert pending applicant record
    const { data: applicant } = await supabase
      .from('applicants')
      .upsert(
        {
          full_name: (fullName || 'Trainee Applicant').trim(),
          phone_e164: phoneE164,
          applicant_ref: studentId ? studentId.trim().toUpperCase() : null,
          ref_type: studentId ? 'student_id' : null,
          status: 'pending'
        },
        { onConflict: 'phone_e164' }
      )
      .select('id')
      .single();

    // Invalidate existing unused codes for this phone
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('phone_e164', phoneE164)
      .eq('purpose', 'applicant')
      .eq('used', false);

    // Generate cryptographic 6-digit code
    const otpCode = generateCryptographicOtp();
    const codeHash = await hashOtpCode(otpCode, pepper);

    // Store HMAC hash in database (expires in 5 minutes)
    await supabase.from('otp_codes').insert({
      purpose: 'applicant',
      phone_e164: phoneE164,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempts: 0,
      used: false
    });

    // Send SMS via Arkesel
    const message = `CTCE Hall Portal: your code is ${otpCode}. It expires in 5 minutes. Do not share it.`;
    await sendArkeselSms({
      recipientE164: phoneE164,
      message,
      kind: 'otp',
      applicantId: applicant?.id,
      supabaseClient: supabase
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code dispatched.',
        cooldown: RESEND_COOLDOWN_SECONDS
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
