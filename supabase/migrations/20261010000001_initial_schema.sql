-- CTCE Hall Portal: Supabase Postgres Migration
-- Schema, Tables, Constraints, Indexes, RLS Policies, Triggers & Security Definer Functions

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- 1. SETTINGS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id int PRIMARY KEY DEFAULT 1,
    portal_open boolean NOT NULL DEFAULT true,
    allocation_mode text NOT NULL DEFAULT 'balanced' CHECK (allocation_mode IN ('balanced', 'sequential')),
    sms_daily_cap int NOT NULL DEFAULT 500 CHECK (sms_daily_cap >= 0),
    current_academic_year text NOT NULL DEFAULT '2026/2027',
    current_semester int NOT NULL DEFAULT 1 CHECK (current_semester IN (1, 2)),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

INSERT INTO public.settings (id, portal_open, allocation_mode, sms_daily_cap, current_academic_year, current_semester)
VALUES (1, true, 'balanced', 500, '2026/2027', 1)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- 2. HALLS (Four mixed halls, 75 spaces each)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.halls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    capacity int NOT NULL CHECK (capacity >= 0),
    colour text NOT NULL,
    sort_order int NOT NULL UNIQUE,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.halls (name, capacity, colour, sort_order, active)
VALUES
    ('St. Theresa Hall', 75, 'blue', 1, true),
    ('St. Thomas Aquinas Hall', 75, 'cream', 2, true),
    ('St. John Bosco Hall', 75, 'green', 3, true),
    ('St. Maria Goretti Hall', 75, 'light green', 4, true)
ON CONFLICT (name) DO NOTHING;

-- -------------------------------------------------------------
-- 3. APPLICANTS SEQUENCE FOR 6-DIGIT APPLICANT ID (STARTING 100001)
-- -------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.applicant_id_seq START WITH 100001 INCREMENT BY 1;

-- -------------------------------------------------------------
-- 4. APPLICANTS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_ref text, -- Student ID or 6-digit Applicant ID
    ref_type text CHECK (ref_type IN ('student_id', 'applicant_id')),
    full_name text NOT NULL,
    programme text NOT NULL DEFAULT 'Bachelor of Education (Primary)',
    phone_e164 text NOT NULL,
    phone_verified_at timestamptz,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'allocated', 'waitlisted', 'graduated')),
    verified_at timestamptz,
    hall_sms_sent_at timestamptz,
    hall_sms_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- PARTIAL unique indexes: Unverified rows must NEVER block real students
CREATE UNIQUE INDEX IF NOT EXISTS idx_applicants_phone_verified 
    ON public.applicants (phone_e164) 
    WHERE phone_verified_at IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_applicants_ref_verified 
    ON public.applicants (applicant_ref) 
    WHERE phone_verified_at IS NOT NULL;

-- -------------------------------------------------------------
-- 5. ALLOCATIONS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allocations (
    applicant_id uuid PRIMARY KEY REFERENCES public.applicants(id) ON DELETE CASCADE,
    hall_id uuid NOT NULL REFERENCES public.halls(id) ON DELETE RESTRICT,
    method text NOT NULL DEFAULT 'auto' CHECK (method IN ('auto', 'manual')),
    reason text,
    allocated_by uuid,
    allocated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT manual_requires_reason CHECK (method <> 'manual' OR (reason IS NOT NULL AND trim(reason) <> ''))
);

-- -------------------------------------------------------------
-- 6. ID DISPUTES
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.id_disputes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_ref text NOT NULL,
    claimant_applicant_ids uuid[] NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    resolved_by uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 7. OTP CODES
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purpose text NOT NULL CHECK (purpose IN ('applicant', 'viewer', 'password_reset')),
    phone_e164 text NOT NULL,
    code_hash text NOT NULL, -- HMAC-SHA-256 with OTP_PEPPER
    expires_at timestamptz NOT NULL,
    attempts int NOT NULL DEFAULT 0,
    used boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup 
    ON public.otp_codes (phone_e164, purpose, created_at DESC);

-- -------------------------------------------------------------
-- 8. RATE LIMITS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key text PRIMARY KEY,
    window_start timestamptz NOT NULL,
    count int NOT NULL DEFAULT 1
);

-- -------------------------------------------------------------
-- 9. VIEWERS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.viewers (
    applicant_id uuid PRIMARY KEY REFERENCES public.applicants(id) ON DELETE CASCADE,
    granted_by uuid,
    granted_at timestamptz NOT NULL DEFAULT now(),
    active boolean NOT NULL DEFAULT true
);

-- -------------------------------------------------------------
-- 10. STAFF (Admin & Super Admin)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 11. SMS LOG
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sms_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid REFERENCES public.applicants(id) ON DELETE SET NULL,
    phone_e164 text NOT NULL,
    kind text NOT NULL,
    provider_message_id text,
    http_status int,
    provider_status text,
    error text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 12. AUDIT LOG (Append-only)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type text NOT NULL,
    actor_id text NOT NULL,
    action text NOT NULL,
    detail jsonb NOT NULL DEFAULT '{}'::jsonb,
    ip_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Block UPDATE and DELETE on audit_log
CREATE OR REPLACE FUNCTION public.block_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_log table is append-only. UPDATE and DELETE are prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_audit_log_mod
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.block_audit_log_modification();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) FOR ALL TABLES
-- -------------------------------------------------------------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Security Definer Helpers for Staff
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.staff
        WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.staff
        WHERE user_id = auth.uid() AND role = 'super_admin'
    );
$$;

-- RLS Policies
CREATE POLICY "Public can view settings" ON public.settings FOR SELECT TO public USING (true);
CREATE POLICY "Super admin can update settings" ON public.settings FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Public can view active halls" ON public.halls FOR SELECT TO public USING (active = true);
CREATE POLICY "Super admin can manage halls" ON public.halls FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Staff can view applicants" ON public.applicants FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Staff can update applicants" ON public.applicants FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Staff can view allocations" ON public.allocations FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Staff can view disputes" ON public.id_disputes FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Super admin can view sms_log" ON public.sms_log FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Staff can view audit_log" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin());

-- Revoke write permissions from public/anon on sensitive tables
REVOKE ALL ON public.otp_codes FROM anon, authenticated, public;
REVOKE ALL ON public.rate_limits FROM anon, authenticated, public;
REVOKE ALL ON public.audit_log FROM anon, authenticated, public;
REVOKE ALL ON public.sms_log FROM anon, authenticated, public;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
