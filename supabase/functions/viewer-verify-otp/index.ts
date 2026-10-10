/**
 * Edge Function: viewer-verify-otp
 * Verifies 6-digit OTP for Viewer login and issues 30-minute Viewer JWT session token.
 * Enforces per-IP rate limits, CAPTCHA verification, and strict CORS.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { hashOtpCode, constantTimeCompare } from '../_shared/otp.ts';
import { createSessionToken } from '../_shared/session.ts';
import {
  checkRateLimit,
  verifyTurnstileToken,
  hashIpWithPepper,
  IP_RATE_LIMIT_MAX,
  IP_RATE_LIMIT_WINDOW_SECONDS
} from '../_shared/ratelimit.ts';
import { validatePhoneServer } from '../_shared/validate.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { phone, code, turnstileToken } = await req.json();

    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. CAPTCHA CHECK IF TOKEN PROVIDED
    if (turnstileToken) {
      const isTurnstileValid = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!isTurnstileValid) {
        return new Response(JSON.stringify({ error: 'Security verification failed.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. VALIDATE INPUTS
    const phoneValidation = validatePhoneServer(phone);
    if (!phoneValidation.isValid || !phoneValidation.normalized) {
      return new Response(JSON.stringify({ error: 'Invalid phone number format.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const phoneE164 = phoneValidation.normalized;

    if (!code || code.trim().length !== 6) {
      return new Response(JSON.stringify({ error: 'Please enter a valid 6-digit verification code.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const pepper = requireEnv('OTP_PEPPER');
    const jwtSecret = requireEnv('SESSION_JWT_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. ATOMIC PER-IP RATE LIMIT
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
          error: 'Rate limit exceeded: Please wait before verifying.',
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

    // 4. RETRIEVE ACTIVE VIEWER OTP RECORD
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_e164', phoneE164)
      .eq('purpose', 'viewer')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) {
      return new Response(JSON.stringify({ error: 'Verification code has expired or was already used.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Increment attempts
    const { data: updatedOtp } = await supabase
      .from('otp_codes')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id)
      .select('attempts')
      .single();

    if (updatedOtp.attempts > 3) {
      await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);
      return new Response(JSON.stringify({ error: 'Too many incorrect attempts. Code is now invalidated.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Compare code hash in constant time
    const computedHash = await hashOtpCode(code.trim(), pepper);
    if (!constantTimeCompare(computedHash, otpRecord.code_hash)) {
      const remaining = 3 - updatedOtp.attempts;
      return new Response(
        JSON.stringify({
          error: remaining > 0 ? `Incorrect code. ${remaining} attempt(s) remaining.` : 'Code invalidated after 3 incorrect attempts.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Mark code as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);

    // Look up applicant and viewer record
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id, full_name, viewers!inner(active)')
      .eq('phone_e164', phoneE164)
      .eq('viewers.active', true)
      .maybeSingle();

    if (!applicant) {
      return new Response(JSON.stringify({ error: 'Viewer account is inactive or not found.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Issue 30-minute JWT token with role 'viewer'
    const token = await createSessionToken(applicant.id, 'viewer', jwtSecret);

    return new Response(
      JSON.stringify({
        token,
        viewer: {
          id: applicant.id,
          fullName: applicant.full_name,
          role: 'viewer'
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Verification failed.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
