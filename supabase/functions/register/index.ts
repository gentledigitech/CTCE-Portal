/**
 * Edge Function: register
 *
 * Creates a student account AFTER the phone number has been verified:
 *   1. checks the 6-digit SMS code (max 3 attempts, 5 min expiry) the same way verify-otp does
 *   2. creates the login (email + password) in Supabase Auth
 *   3. saves the applicant record, linked to that login
 *   4. allocates a hall and sends the hall SMS
 *
 * The browser never creates accounts itself, so nobody can skip phone verification.
 * Deploy with JWT verification OFF (the SMS code is the protection here):
 *   supabase functions deploy register --no-verify-jwt
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/env.ts';
import { sendArkeselSms } from '../_shared/sms.ts';
import { hashOtpCode, constantTimeCompare } from '../_shared/otp.ts';
import { validatePhoneServer } from '../_shared/validate.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

// Trainee ID: CTCE/<3 capital letters>/<2-digit intake year>/0<3 digits>, e.g. CTCE/JHS/26/0123
const TRAINEE_ID_PATTERN = /^CTCE\/[A-Z]{3}\/(\d{2})\/0\d{3}$/;
const DEFAULT_PROGRAMME = 'Bachelor of Education (Primary)';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return json({ error: 'Invalid request.' }, 400);
    }

    const { phone, code, fullName, email, password, studentId, programme } = body as Record<string, unknown>;

    // ---------- 1. Validate everything the browser sent ----------
    const phoneValidation = validatePhoneServer(phone);
    if (!phoneValidation.isValid || !phoneValidation.normalized) {
      return json({ error: 'Invalid Ghanaian phone number.' }, 400);
    }
    const phoneE164 = phoneValidation.normalized;

    const cleanCode = String(code ?? '').trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return json({ error: 'Please enter the 6-digit verification code.' }, 400);
    }

    const cleanName = String(fullName ?? '').trim().replace(/\s+/g, ' ');
    if (cleanName.length < 3 || cleanName.length > 100) {
      return json({ error: 'Please enter your full name.' }, 400);
    }

    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      return json({ error: 'Password must be between 8 and 72 characters.' }, 400);
    }

    const cleanStudentId = studentId ? String(studentId).trim().toUpperCase().slice(0, 40) : null;
    const requestedProgramme = String(programme ?? '').trim().slice(0, 120);

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const pepper = requireEnv('OTP_PEPPER');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ---------- 1a. Programme must be one of the allowed ones ----------
    const { data: allowedProgrammes, error: programmesError } = await supabase.rpc('allowed_programmes');
    if (programmesError || !Array.isArray(allowedProgrammes)) {
      console.error('allowed_programmes failed:', programmesError?.message);
      return json({ error: 'Registration is not available right now. Please try again later.' }, 503);
    }
    if (requestedProgramme && !allowedProgrammes.includes(requestedProgramme)) {
      return json({ error: 'Please choose one of the listed programmes.' }, 400);
    }
    // Old cached copies of the site do not send a programme yet; they get the default
    const cleanProgramme = requestedProgramme || DEFAULT_PROGRAMME;

    // ---------- 1b. Trainee ID rule and level (the server decides, never the browser) ----------
    // level = (start year of the current academic year - intake year + 1) x 100
    const { data: settingsRow } = await supabase
      .from('settings')
      .select('current_academic_year')
      .eq('id', 1)
      .maybeSingle();
    const startYear = parseInt(String(settingsRow?.current_academic_year ?? '').split('/')[0], 10);
    if (!Number.isInteger(startYear)) {
      console.error('settings.current_academic_year is missing or invalid');
      return json({ error: 'Registration is not available right now. Please try again later.' }, 503);
    }

    let intakeYear = startYear; // applicants without a Trainee ID count as this year's intake
    let cleanLevel = 100;
    if (cleanStudentId) {
      const match = TRAINEE_ID_PATTERN.exec(cleanStudentId);
      if (!match) {
        return json({ error: 'Trainee ID must look like CTCE/ABC/26/0123.' }, 400);
      }
      intakeYear = 2000 + parseInt(match[1], 10);
      const levelNow = (startYear - intakeYear + 1) * 100;
      if (levelNow < 100) {
        return json({ error: 'This Trainee ID is for a future intake and cannot be used yet.' }, 400);
      }
      if (levelNow > 400) {
        return json(
          { error: 'This Trainee ID belongs to a trainee who has completed the programme and can no longer be used on this portal.' },
          400
        );
      }
      cleanLevel = levelNow;
    }

    // ---------- 2. Check the SMS code (same rules as verify-otp) ----------
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
      return json({ error: 'Verification code has expired or was already used. Please request a new one.' }, 400);
    }

    // Count this attempt. The "attempts = old value" condition makes parallel guesses fail.
    const { data: updatedOtp } = await supabase
      .from('otp_codes')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id)
      .eq('attempts', otpRecord.attempts)
      .select('attempts')
      .maybeSingle();

    if (!updatedOtp) {
      return json({ error: 'Please try again.' }, 409);
    }

    if (updatedOtp.attempts > 3) {
      await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);
      return json({ error: 'Too many incorrect attempts. Please request a new code.' }, 400);
    }

    const computedHash = await hashOtpCode(cleanCode, pepper);
    if (!constantTimeCompare(computedHash, otpRecord.code_hash)) {
      const remaining = 3 - updatedOtp.attempts;
      return json(
        {
          error:
            remaining > 0
              ? `Incorrect code. ${remaining} attempt(s) remaining.`
              : 'Code invalidated after 3 incorrect attempts. Please request a new code.'
        },
        400
      );
    }

    // ---------- 3. Make sure this phone is not already registered ----------
    const { data: existing } = await supabase
      .from('applicants')
      .select('id, hall_sms_count')
      .eq('phone_e164', phoneE164)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: linked } = await supabase
        .from('applicants')
        .select('user_id')
        .eq('id', existing.id)
        .maybeSingle();
      if (linked?.user_id) {
        return json({ error: 'An account with this phone number already exists. Please sign in.' }, 409);
      }
    }

    // ---------- 4. Create the login ----------
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true, // the phone number is what we verify, not the email
      user_metadata: { full_name: cleanName }
    });

    if (createError || !created?.user) {
      const message = (createError?.message || '').toLowerCase();
      if (message.includes('already') || (createError as { code?: string } | null)?.code === 'email_exists') {
        return json({ error: 'An account with this email address already exists.' }, 409);
      }
      if (message.includes('password')) {
        return json({ error: createError!.message }, 400);
      }
      console.error('createUser failed:', createError?.message);
      return json({ error: 'Could not create the account. Please try again.' }, 500);
    }
    const authUserId = created.user.id;

    // ---------- 5. Save the applicant record ----------
    let applicantRef = cleanStudentId;
    let refType = 'student_id';
    if (!applicantRef) {
      const { data: nextSeq } = await supabase.rpc('get_next_applicant_seq');
      applicantRef = nextSeq ? nextSeq.toString() : (100000 + Math.floor(Math.random() * 900000)).toString();
      refType = 'applicant_id';
    }

    const nowIso = new Date().toISOString();
    const record = {
      full_name: cleanName,
      email: cleanEmail,
      phone_e164: phoneE164,
      programme: cleanProgramme,
      level: cleanLevel,
      intake_year: intakeYear,
      user_id: authUserId,
      applicant_ref: applicantRef,
      ref_type: refType,
      phone_verified_at: nowIso,
      verified_at: nowIso,
      status: 'verified'
    };

    const saved = existing
      ? await supabase.from('applicants').update(record).eq('id', existing.id).select('id').single()
      : await supabase.from('applicants').insert(record).select('id').single();

    if (saved.error || !saved.data) {
      // Undo the login so the person can try again cleanly
      await supabase.auth.admin.deleteUser(authUserId);
      console.error('applicant save failed:', saved.error?.message);
      if (saved.error?.code === '23505') {
        return json(
          {
            error:
              'That Trainee ID or email is already registered. Please contact the portal administrator if this is a mistake.'
          },
          409
        );
      }
      return json({ error: 'Could not save your registration. Please try again.' }, 500);
    }
    const applicantId: string = saved.data.id;

    // The code has done its job
    await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);

    // ---------- 6. Allocate a hall and send the hall SMS ----------
    let status = 'verified';
    let hall: { id: string; name: string; colour: string } | null = null;

    const { data: allocResult, error: allocError } = await supabase.rpc('allocate_hall', {
      p_applicant: applicantId
    });

    if (allocError) {
      // The account is valid; the hall can be allocated again later.
      console.error('allocate_hall failed:', allocError.message);
    } else if (allocResult) {
      status = allocResult.status ?? status;
      if (allocResult.hall_name) {
        hall = { id: allocResult.hall_id, name: allocResult.hall_name, colour: allocResult.hall_colour };
      }

      if (allocResult.is_new && allocResult.hall_name) {
        try {
          const firstName = cleanName.split(' ')[0].slice(0, 30);
          await sendArkeselSms({
            recipientE164: phoneE164,
            message: `CTCE: Hello ${firstName}, you have been allocated to ${allocResult.hall_name}. Ref ${applicantRef}. Show this message at hall registration.`,
            kind: 'hall_allocation',
            applicantId,
            supabaseClient: supabase
          });
          await supabase
            .from('applicants')
            .update({
              hall_sms_sent_at: new Date().toISOString(),
              hall_sms_count: (existing?.hall_sms_count || 0) + 1
            })
            .eq('id', applicantId);
        } catch (smsErr) {
          console.error('hall SMS failed:', smsErr instanceof Error ? smsErr.message : smsErr);
        }
      }
    }

    return json({ success: true, applicantRef, status, hall });
  } catch (err) {
    console.error('register failed:', err instanceof Error ? err.message : err);
    return json({ error: 'Registration failed. Please try again.' }, 500);
  }
});
