# CTCE Hall Portal: Pre-Launch Security & Verification Checklist

This checklist documents every security protection implemented in the CTCE Hall Portal and the exact verification procedures required before production deployment.

---

## 1. Secrets & Credentials Isolation
- [ ] **No Client Secrets**: Confirm that the client build only receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [ ] **Backend Secrets in Vault**: Ensure `ARKESEL_API_KEY`, `ARKESEL_SENDER_ID`, `OTP_PEPPER`, `SESSION_JWT_SECRET`, `TURNSTILE_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` exist strictly in Supabase Edge Function Secrets (`supabase secrets set ...`).
- [ ] **No Leakage in Git/Code**: Verify `.env.example` contains only empty placeholders. No secrets in source control.

## 2. In-Memory Session Storage
- [ ] **Zero Sensitive LocalStorage**: Verify that Applicant and Viewer JWT tokens are kept strictly in memory in `src/lib/api.ts` and `src/context/AuthContext.tsx`.
- [ ] **No Tokens in Storage**: Inspect browser DevTools -> Application -> Local Storage. Verify that no auth tokens, student IDs, or unmasked phone numbers are saved to persistent client storage.

## 3. Cryptographic OTP Verification
- [ ] **Unpredictable OTP Generation**: Codes are generated using `crypto.getRandomValues(uint32Array)`, never `Math.random()`.
- [ ] **HMAC-SHA-256 Hashing**: Codes are hashed with `OTP_PEPPER` before storing in `otp_codes`.
- [ ] **Constant-Time Comparison**: `constantTimeCompare()` prevents timing side-channel attacks.
- [ ] **Atomic Attempt Counter**: `UPDATE otp_codes SET attempts = attempts + 1 ... RETURNING` prevents race conditions from exceeding 3 allowed attempts.
- [ ] **5-Minute Expiration**: Codes expire 300 seconds after generation.
- [ ] **Zero Code Logging**: Neither `sms_log` nor `audit_log` nor the UI ever stores or renders raw OTP codes.

## 4. Rate Limiting & Anti-Abuse
- [ ] **Phone Rate Limit**: Max 3 OTP codes per phone number per hour.
- [ ] **IP Rate Limit**: Max 10 OTP codes per IP address per hour.
- [ ] **60-Second Cooldown**: Rapid resend attempts within 60 seconds return generic success without dispatching duplicate SMS.
- [ ] **Daily Cap Enforced**: `sms_daily_cap` prevents runaway SMS billing.
- [ ] **Cloudflare Turnstile**: Edge functions verify Turnstile tokens before initiating SMS.

## 5. Hall Allocation Integrity
- [ ] **Advisory Lock**: `pg_advisory_xact_lock(hashtext('allocate'))` protects concurrent allocations from race conditions.
- [ ] **Capacity Ceilings**: Hall capacity can never be exceeded; `set_hall_capacity` refuses values below current occupancy.
- [ ] **Idempotent Calls**: Multiple calls for the same applicant return the existing hall with `is_new: false`.
- [ ] **Partial Unique Indexes**: `phone_e164` and `applicant_ref` unique constraints apply ONLY `WHERE phone_verified_at IS NOT NULL`. Unverified submissions can never denial-of-service real students.
- [ ] **Waitlist Guarantee**: When halls are full, applicants transition to `waitlisted`. Expanding capacity automatically promotes waitlisted students in verified order.

## 6. Access Control & Row Level Security (RLS)
- [ ] **RLS Enabled on All Tables**: Settings, Halls, Applicants, Allocations, Disputes, OTP, Viewers, Staff, SMS logs, Audit logs.
- [ ] **Fixed Search Path**: All security-definer SQL functions set `search_path = public, pg_temp` to prevent schema hijacking.
- [ ] **Role Verification in Database**: `is_admin()` and `is_super_admin()` verify membership in the `staff` table, never relying on client-supplied JWT claims.
- [ ] **Protected Functions**: `allocate_hall` and `process_waitlist` revoked from `PUBLIC`, `anon`, and `authenticated`; granted exclusively to `service_role`.

## 7. Append-Only Audit Trail
- [ ] **Blocking Trigger**: `trg_block_audit_log_mod` throws an exception on any `UPDATE` or `DELETE` attempt against `audit_log`.
- [ ] **Sanitized Audit Records**: Audit entries hash IP addresses and never include OTP codes or full phone numbers.

## 8. Frontend Security & Content Security Policy (CSP)
- [ ] **No dangerouslySetInnerHTML**: Zero usage across all React components.
- [ ] **Vercel Headers**: `vercel.json` configures strict CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and restrictive Permissions-Policy.
- [ ] **Formula Injection Neutralization**: CSV export sanitizes fields beginning with `=`, `+`, `-`, or `@` by prefixing with a single quote (`'`).

## 9. PWA Offline & Cache Isolation
- [ ] **Static Shell Only**: Service worker caches only `/index.html`, `/offline.html`, manifest, and static shell assets.
- [ ] **No API Caching**: Requests to Supabase REST, Edge Functions, or personal trainee records bypass the service worker cache completely.
