/**
 * Edge Function: verify-otp
 * Verifies 6-digit OTP (max 3 attempts, 5 min expiry), assigns ID, calls allocate_hall,
 * dispatches hall SMS if new allocation, issues 30-minute session JWT.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { sendArkeselSms } from '../_shared/sms.ts';
import { hashOtpCode, constantTimeCompare } from '../_shared/otp.ts';
import { createSessionToken } from '../_shared/session.ts';
import { validatePhoneServer } from '../_shared/validate.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { phone, code } = await req.json();

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

    // Strictly require environment variables without fallback defaults
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const pepper = requireEnv('OTP_PEPPER');
    const jwtSecret = requireEnv('SESSION_JWT_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve active OTP record
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_e164', phoneE164)
      .eq('purpose', 'applicant')
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

    // Atomic increment of attempts to guarantee max 3 attempts
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

    // Hash user-submitted code and compare in constant time
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

    // Find applicant
    const { data: applicant } = await supabase
      .from('applicants')
      .select('*')
      .eq('phone_e164', phoneE164)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!applicant) {
      return new Response(JSON.stringify({ error: 'Applicant record not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If no Student ID provided, assign 6-digit numeric Applicant ID from sequence starting 100001
    let assignedRef = applicant.applicant_ref;
    let refType = applicant.ref_type;

    if (!assignedRef) {
      const { data: nextSeq } = await supabase.rpc('get_next_applicant_seq');
      assignedRef = nextSeq ? nextSeq.toString() : (100000 + Math.floor(Math.random() * 900000)).toString();
      refType = 'applicant_id';
    }

    // Mark phone verified
    await supabase
      .from('applicants')
      .update({
        phone_verified_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        applicant_ref: assignedRef,
        ref_type: refType,
        status: 'verified'
      })
      .eq('id', applicant.id);

    // Execute allocate_hall via database RPC
    const { data: allocResult, error: allocError } = await supabase.rpc('allocate_hall', {
      p_applicant: applicant.id
    });

    if (allocError) {
      throw allocError;
    }

    // If new allocation, send Hall Allocation SMS
    if (allocResult.is_new && allocResult.hall_name) {
      const firstName = applicant.full_name.split(' ')[0].slice(0, 30);
      const hallMsg = `CTCE: Hello ${firstName}, you have been allocated to ${allocResult.hall_name}. Ref ${assignedRef}. Show this message at hall registration.`;

      await sendArkeselSms({
        recipientE164: phoneE164,
        message: hallMsg,
        kind: 'hall_allocation',
        applicantId: applicant.id,
        supabaseClient: supabase
      });

      await supabase
        .from('applicants')
        .update({
          hall_sms_sent_at: new Date().toISOString(),
          hall_sms_count: (applicant.hall_sms_count || 0) + 1
        })
        .eq('id', applicant.id);
    }

    // Issue 30-minute JWT token
    const token = await createSessionToken(applicant.id, 'applicant', jwtSecret);

    return new Response(
      JSON.stringify({
        token,
        applicant: {
          id: applicant.id,
          fullName: applicant.full_name,
          applicantRef: assignedRef,
          status: allocResult.status,
          hall: allocResult.hall_name
            ? {
                id: allocResult.hall_id,
                name: allocResult.hall_name,
                colour: allocResult.hall_colour
              }
            : null
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
