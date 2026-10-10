# CTCE Hall Portal
**Christ the Teacher College of Education (CTCE)**

Mobile-first, installable progressive web application (PWA) and automated hall allocation system for Christ the Teacher College of Education.

---

## Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (installable PWA with service worker and offline shell).
- **Backend**: Supabase (PostgreSQL with Row Level Security, advisory locks, append-only audit trail, and Deno Edge Functions).
- **SMS Gateway**: Arkesel REST API (v2) called exclusively from server-side Edge Functions with rate limiting and redaction.

---

## Deployment Order

Follow these steps in strict sequence for production launch:

### Step 1: Arkesel Sender ID Approval
1. Log into your [Arkesel Portal](https://sms.arkesel.com).
2. Request approval for the official Alphanumeric Sender ID: `CTCE SRC`.
3. Note your Arkesel API key from the developer dashboard.

### Step 2: Supabase Migrations
Apply the PostgreSQL migrations in order using the Supabase CLI:
```bash
# Link your Supabase project
supabase link --project-ref pvkeropaviefewlctlxr

# Apply database migrations
supabase db push
# Or run the files directly in SQL Editor:
# 1. /supabase/migrations/20261010000001_initial_schema.sql
# 2. /supabase/migrations/20261010000002_functions.sql
```

### Step 3: Run Database Verification Tests
Execute the SQL test suite in Supabase SQL editor:
```bash
# Run /supabase/tests/allocation_tests.sql
# Proves 400 verified applicants into 300 spaces yields 300 allocated and 100 waitlisted,
# checks idempotency, privilege revocation, and capacity thresholds.
```

### Step 4: Configure Supabase Secrets
Set backend secrets in the Supabase CLI or Dashboard (Project Settings -> Edge Functions -> Secrets):
```bash
supabase secrets set ARKESEL_API_KEY="your-arkesel-api-key"
supabase secrets set ARKESEL_SENDER_ID="CTCE SRC"
supabase secrets set OTP_PEPPER="$(openssl rand -hex 32)"
supabase secrets set SESSION_JWT_SECRET="$(openssl rand -hex 32)"
supabase secrets set TURNSTILE_SECRET="your-cloudflare-turnstile-secret"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 5: Deploy Edge Functions
Deploy all serverless Edge Functions:
```bash
supabase functions deploy request-otp
supabase functions deploy verify-otp
supabase functions deploy get-my-hall
supabase functions deploy resend-hall-sms
supabase functions deploy viewer-search
supabase functions deploy admin-create-admin
```

### Step 6: Create the First Super Admin in SQL
In Supabase SQL Editor:
```sql
-- Replace 'USER_UUID_FROM_AUTH_USERS' with the Super Admin's Auth user ID:
INSERT INTO public.staff (user_id, role)
VALUES ('USER_UUID_FROM_AUTH_USERS', 'super_admin');
```

### Step 7: Vercel Frontend Deployment
1. Connect the GitHub repository to Vercel.
2. In Vercel Project Settings -> Environment Variables, configure:
   ```env
   VITE_SUPABASE_URL="https://pvkeropaviefewlctlxr.supabase.co"
   VITE_SUPABASE_ANON_KEY="sb_publishable_0x22aV76m_vC1YGbg6GikA_GyMWM6eR"
   VITE_USE_MOCK="false"
   ```
   *(Note: The build will fail if `VITE_USE_MOCK=true` in production)*.
3. Deploy. The `vercel.json` file automatically applies production Content-Security-Policy and HTTP security headers.

---

## Local Development & Mock Preview Mode

In AI Studio preview or local testing:
- Set `VITE_USE_MOCK="true"` in `.env`.
- Super Admin Special Access:
  - **Email**: `kinggentlejustice@proton.me`
  - **Password**: `Admin`
  - **Confirmation Code**: `419248` (no hint displayed on screen)
- To create continuing students with Trainee IDs:
  - Check "I have a Student ID / Trainee ID" on Sign Up.
  - Enter format: `CTCE/BEE/25/0123` (25 = Level 200, 24 = Level 300, 23 = Level 400).
- Passport photo upload (< 2MB) is available in **Settings** and previews live in the top header.
- Advancing the Academic Year (2026/2027 &rarr; 2027/2028) automatically promotes students, and triggers graduation completion for Level 400 students.
