/**
 * Edge Function: viewer-search
 * Read-only search for Viewers.
 * Returns only name, ID, hall, and masked phone (+233 24 *** **78).
 * Never exposes unmasked phone numbers, audit trails, or internal timestamps.
 * 
 * Strict Security Rules:
 * 1. Session token role MUST be 'viewer', and viewer MUST be active in the database.
 * 2. Rate limiting: 30 searches per 10 minutes per viewer session, plus a per-IP limit (returns 429 with Retry-After).
 * 3. Search term sanitization: trimmed, all characters except letters, digits, space, hyphen, slash, apostrophe, and period removed, capped at 50 chars, rejected if < 3 chars with clear error.
 * 4. Never put raw text into .or() - safe parameterized .ilike() queries.
 * 5. Write one audit_log row per search with viewer's id and term length (NOT the term).
 * 6. Strict CORS via ALLOWED_ORIGIN secret.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { verifySessionToken } from '../_shared/session.ts';
import { checkRateLimit, hashIpWithPepper } from '../_shared/ratelimit.ts';

const VIEWER_SEARCH_MAX = 30;
const VIEWER_SEARCH_WINDOW_SECONDS = 600; // 10 minutes

function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('233')) {
    const net = digits.slice(3, 5);
    const last2 = digits.slice(10, 12);
    return `+233 ${net} *** **${last2}`;
  }
  return `+233 ** *** **${digits.slice(-2)}`;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const activeCorsHeaders = getCorsHeaders();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Only POST is accepted.' }), {
      status: 405,
      headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Bearer session token is required.' }), {
        status: 401,
        headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = requireEnv('SESSION_JWT_SECRET');
    const session = await verifySessionToken(token, jwtSecret);

    // 1. Confirm session token role is strictly 'viewer'
    if (!session || session.role !== 'viewer') {
      return new Response(JSON.stringify({ error: 'Forbidden. Viewer privileges required.' }), {
        status: 403,
        headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const otpPepper = requireEnv('OTP_PEPPER');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Confirm the viewer is still active in the database
    const { data: viewer, error: viewerErr } = await supabase
      .from('viewers')
      .select('applicant_id, active')
      .eq('applicant_id', session.applicantId)
      .eq('active', true)
      .maybeSingle();

    if (viewerErr || !viewer) {
      return new Response(JSON.stringify({ error: 'Viewer account is inactive or not found.' }), {
        status: 403,
        headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 3. Rate limiting: 30 searches per 10 minutes per viewer session
    const sessionRateLimitKey = `viewer_search:session:${session.applicantId}`;
    const sessionCheck = await checkRateLimit(
      supabase,
      sessionRateLimitKey,
      VIEWER_SEARCH_MAX,
      VIEWER_SEARCH_WINDOW_SECONDS
    );

    if (!sessionCheck.allowed) {
      const retryAfter = sessionCheck.retryAfterSeconds > 0 ? sessionCheck.retryAfterSeconds : VIEWER_SEARCH_WINDOW_SECONDS;
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded: Maximum 30 searches per 10 minutes per session. Please wait before searching again.',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            ...activeCorsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    // 4. Rate limiting: per-IP limit (30 searches per 10 minutes per IP)
    const hashedIp = await hashIpWithPepper(clientIp, otpPepper);
    const ipRateLimitKey = `viewer_search:ip:${hashedIp}`;
    const ipCheck = await checkRateLimit(
      supabase,
      ipRateLimitKey,
      VIEWER_SEARCH_MAX,
      VIEWER_SEARCH_WINDOW_SECONDS
    );

    if (!ipCheck.allowed) {
      const retryAfter = ipCheck.retryAfterSeconds > 0 ? ipCheck.retryAfterSeconds : VIEWER_SEARCH_WINDOW_SECONDS;
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded: Maximum 30 searches per 10 minutes per network IP. Please wait before searching again.',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            ...activeCorsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    // 5. Sanitize search term before it is used in any filter:
    // - trim it
    // - remove every character except letters, digits, space, hyphen, slash, apostrophe and period
    // - cap it at 50 characters
    // - reject terms shorter than 3 characters with a clear error
    const body = await req.json().catch(() => ({}));
    const rawQuery = typeof body.query === 'string' ? body.query : (typeof body.term === 'string' ? body.term : '');
    const trimmedQuery = rawQuery.trim();
    const sanitizedQuery = trimmedQuery.replace(/[^a-zA-Z0-9 \-\/'\.]/g, '');
    const cappedQuery = sanitizedQuery.slice(0, 50);

    if (cappedQuery.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Search term must be at least 3 characters long.' }),
        {
          status: 400,
          headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 6. Write one audit_log row per search with the viewer's id and the term length, NOT the term
    await supabase.from('audit_log').insert({
      actor_type: 'viewer',
      actor_id: session.applicantId,
      action: 'VIEWER_SEARCH',
      detail: { term_length: cappedQuery.length },
      ip_hash: hashedIp
    });

    // 7. Query without raw text in .or().
    // Use parameter-safe .ilike() queries for full_name and applicant_ref, then deduplicate
    const selectFields = `
      id,
      full_name,
      applicant_ref,
      phone_e164,
      allocations (
        halls (
          name,
          colour
        )
      )
    `;

    const [nameQueryRes, refQueryRes] = await Promise.all([
      supabase
        .from('applicants')
        .select(selectFields)
        .not('phone_verified_at', 'is', null)
        .ilike('full_name', `%${cappedQuery}%`)
        .limit(50),
      supabase
        .from('applicants')
        .select(selectFields)
        .not('phone_verified_at', 'is', null)
        .ilike('applicant_ref', `%${cappedQuery}%`)
        .limit(50)
    ]);

    if (nameQueryRes.error) throw nameQueryRes.error;
    if (refQueryRes.error) throw refQueryRes.error;

    const seenIds = new Set<string>();
    const combinedResults: any[] = [];

    for (const item of [...(nameQueryRes.data || []), ...(refQueryRes.data || [])]) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        combinedResults.push(item);
      }
    }

    // Sanitize output strictly to allowed fields with masked phone
    const sanitized = combinedResults.slice(0, 50).map((row: any) => {
      const alloc = row.allocations?.[0];
      return {
        fullName: row.full_name,
        applicantRef: row.applicant_ref,
        maskedPhone: maskPhoneNumber(row.phone_e164),
        hallName: alloc?.halls?.name || 'Unallocated',
        hallColour: alloc?.halls?.colour || 'neutral'
      };
    });

    return new Response(JSON.stringify({ results: sanitized }), {
      status: 200,
      headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Search failed.' }), {
      status: 500,
      headers: { ...activeCorsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
