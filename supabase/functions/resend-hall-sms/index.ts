/**
 * Edge Function: resend-hall-sms
 * Resends hall allocation SMS notification to the verified applicant.
 * Enforces per-IP and per-phone rate limits, CAPTCHA verification, and strict CORS.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { sendArkeselSms } from '../_shared/sms.ts';
import { verifySessionToken } from '../_shared/session.ts';
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

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { turnstileToken, applicantId } = await req.json();

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

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const pepper = requireEnv('OTP_PEPPER');
    const jwtSecret = requireEnv('SESSION_JWT_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. ATOMIC PER-IP RATE LIMIT
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
          error: 'Rate limit exceeded: Maximum 4 SMS sends per hour per IP. Please wait before requesting another SMS.',
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

    // 3. AUTHENTICATION / APPLICANT IDENTIFICATION
    let targetApplicantId = applicantId;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = await verifySessionToken(token, jwtSecret);
      if (session && session.role === 'applicant') {
        targetApplicantId = session.applicantId;
      }
    }

    if (!targetApplicantId) {
      return new Response(JSON.stringify({ error: 'Applicant identification is required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Look up applicant and allocation
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select(`
        id,
        full_name,
        applicant_ref,
        phone_e164,
        hall_sms_count,
        hall_sms_sent_at,
        allocations (
          hall_id,
          halls (
            name,
            colour
          )
        )
      `)
      .eq('id', targetApplicantId)
      .single();

    if (applicantError || !applicant) {
      return new Response(JSON.stringify({ error: 'Applicant record not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const alloc = applicant.allocations?.[0];
    if (!alloc || !alloc.halls) {
      return new Response(JSON.stringify({ error: 'No allocated hall found to resend SMS for.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. ATOMIC PER-PHONE RATE LIMIT
    const phoneLimit = await checkRateLimit(
      supabase,
      `phone:${applicant.phone_e164}`,
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

    // 5. MINIMUM COOLDOWN CHECK (60 SECONDS)
    if (applicant.hall_sms_sent_at) {
      const elapsed = Date.now() - new Date(applicant.hall_sms_sent_at).getTime();
      const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        return new Response(
          JSON.stringify({
            error: `Please wait ${remaining}s before requesting another SMS.`,
            retryAfter: remaining
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': remaining.toString()
            }
          }
        );
      }
    }

    // 6. DISPATCH ARKESEL SMS
    const firstName = applicant.full_name.split(' ')[0].slice(0, 30);
    const hallMsg = `CTCE: Hello ${firstName}, you have been allocated to ${alloc.halls.name}. Ref ${applicant.applicant_ref}. Show this message at hall registration.`;

    const smsRes = await sendArkeselSms({
      recipientE164: applicant.phone_e164,
      message: hallMsg,
      kind: 'hall_allocation',
      applicantId: applicant.id,
      supabaseClient: supabase
    });

    if (!smsRes.success) {
      return new Response(
        JSON.stringify({ error: smsRes.error || 'SMS could not be sent. Please retry shortly.' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 7. UPDATE APPLICANT SMS COUNTER
    await supabase
      .from('applicants')
      .update({
        hall_sms_sent_at: new Date().toISOString(),
        hall_sms_count: (applicant.hall_sms_count || 0) + 1
      })
      .eq('id', applicant.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hall allocation SMS dispatched.',
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
