/**
 * Edge Function: viewer-request-otp
 * Dispatches 6-digit verification code to authorized Viewer phone contact.
 * Enforces per-IP and per-phone rate limits, CAPTCHA verification, and strict CORS.
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
    const { phone, turnstileToken } = await req.json();

    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. CAPTCHA CHECK: turnstileToken must NOT be missing, empty or non-string
    if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Security verification token (turnstileToken) is required.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const isTurnstileValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isTurnstileValid) {
      return new Response(JSON.stringify({ error: 'Security verification failed.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. VALIDATE PHONE
    const phoneValidation = validatePhoneServer(phone);
    if (!phoneValidation.isValid || !phoneValidation.normalized) {
      return new Response(JSON.stringify({ error: 'Invalid Ghanaian phone number format.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const phoneE164 = phoneValidation.normalized;

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const pepper = requireEnv('OTP_PEPPER');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. ATOMIC PER-IP RATE LIMIT CHECK
    const hashedIp = await hashIpWithPepper(clientIp, pepper);
    const ipLimit = await checkRateLimit(
      supabase,
      `ip:${hashedIp}`,
      IP_RATE_LIMIT_MAX,
      IP_RATE_LIMIT_WINDOW_SECONDS
    );

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

    // 4. ATOMIC PER-PHONE RATE LIMIT CHECK
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

    // 5. CHECK COOLDOWN (60 SECONDS)
    const { data: recentOtp } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('phone_e164', phoneE164)
      .eq('purpose', 'viewer')
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

    // 6. VERIFY VIEWER ELIGIBILITY IN DATABASE
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id, full_name, viewers!inner(active)')
      .eq('phone_e164', phoneE164)
      .eq('viewers.active', true)
      .maybeSingle();

    if (!applicant) {
      return new Response(
        JSON.stringify({ error: 'No active Viewer account found registered with this phone number.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Invalidate existing unused codes for this phone
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('phone_e164', phoneE164)
      .eq('purpose', 'viewer')
      .eq('used', false);

    // Generate cryptographic 6-digit code
    const otpCode = generateCryptographicOtp();
    const codeHash = await hashOtpCode(otpCode, pepper);

    // Store in database (expires in 5 minutes)
    await supabase.from('otp_codes').insert({
      purpose: 'viewer',
      phone_e164: phoneE164,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempts: 0,
      used: false
    });

    // Send SMS via Arkesel
    const message = `CTCE Hall Portal Viewer Access: your code is ${otpCode}. It expires in 5 minutes. Do not share it.`;
    await sendArkeselSms({
      recipientE164: phoneE164,
      message,
      kind: 'otp',
      applicantId: applicant.id,
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
