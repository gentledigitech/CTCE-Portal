/**
 * Edge Function: viewer-search
 * Read-only search for Viewers.
 * Returns only name, ID, hall, and masked phone (+233 24 *** **78).
 * Never exposes unmasked phone numbers, audit trails, or internal timestamps.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { verifySessionToken } from '../_shared/session.ts';

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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Bearer token required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = requireEnv('SESSION_JWT_SECRET');
    const session = await verifySessionToken(token, jwtSecret);

    if (!session || (session.role !== 'viewer' && session.role !== 'admin' && session.role !== 'super_admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden. Viewer privileges required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { query } = await req.json();
    const searchTerm = query ? query.trim() : '';

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let queryBuilder = supabase
      .from('applicants')
      .select(`
        full_name,
        applicant_ref,
        phone_e164,
        allocations (
          halls (
            name,
            colour
          )
        )
      `)
      .not('phone_verified_at', 'is', null);

    if (searchTerm) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${searchTerm}%,applicant_ref.ilike.%${searchTerm}%`);
    }

    const { data: results, error } = await queryBuilder.limit(50);
    if (error) throw error;

    // Sanitize output strictly to allowed fields with masked phone
    const sanitized = (results || []).map((row: any) => {
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Search failed.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
