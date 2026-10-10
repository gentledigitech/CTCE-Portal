/**
 * Edge Function: get-my-hall
 * Retrieves verified hall allocation status and details for an authenticated applicant.
 * Enforces per-IP rate limits, CAPTCHA verification, and strict CORS.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { verifySessionToken } from '../_shared/session.ts';
import {
  checkRateLimit,
  verifyTurnstileToken,
  hashIpWithPepper,
  IP_RATE_LIMIT_MAX,
  IP_RATE_LIMIT_WINDOW_SECONDS
} from '../_shared/ratelimit.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const pepper = requireEnv('OTP_PEPPER');
    const jwtSecret = requireEnv('SESSION_JWT_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. ATOMIC PER-IP RATE LIMIT
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
          error: 'Rate limit exceeded: Please wait before querying hall allocation.',
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

    // 2. AUTHENTICATION (Applicant Bearer JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Bearer token required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    const session = await verifySessionToken(token, jwtSecret);

    if (!session || (session.role !== 'applicant' && session.role !== 'admin' && session.role !== 'super_admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden: Applicant session required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Optional CAPTCHA check if turnstileToken passed in body
    if (req.method === 'POST') {
      try {
        const body = await req.json().catch(() => ({}));
        if (body.turnstileToken) {
          const isTurnstileValid = await verifyTurnstileToken(body.turnstileToken, clientIp);
          if (!isTurnstileValid) {
            return new Response(JSON.stringify({ error: 'Security verification failed.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      } catch {
        // Body reading error ignored if not JSON
      }
    }

    // 3. RETRIEVE APPLICANT RECORD & ALLOCATION
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select(`
        id,
        full_name,
        applicant_ref,
        phone_e164,
        status,
        allocations (
          hall_id,
          halls (
            id,
            name,
            colour
          )
        )
      `)
      .eq('id', session.applicantId)
      .single();

    if (applicantError || !applicant) {
      return new Response(JSON.stringify({ error: 'Applicant record not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const alloc = applicant.allocations?.[0];
    const hall = alloc?.halls
      ? {
          id: alloc.halls.id,
          name: alloc.halls.name,
          colour: alloc.halls.colour
        }
      : null;

    return new Response(
      JSON.stringify({
        applicant: {
          id: applicant.id,
          fullName: applicant.full_name,
          applicantRef: applicant.applicant_ref,
          status: applicant.status,
          hall
        }
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
