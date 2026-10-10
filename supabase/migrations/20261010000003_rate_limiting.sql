-- Migration: 20261010000003_rate_limiting.sql
-- Atomic per-IP rate limiting table and check_rate_limit stored function
-- Backed by rate_limits table, using row-level & transaction advisory locks.

-- -------------------------------------------------------------
-- 1. RATE LIMITS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key text PRIMARY KEY,
    window_start timestamptz NOT NULL,
    count int NOT NULL DEFAULT 1
);

-- Ensure index on window_start for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits (window_start);

-- -------------------------------------------------------------
-- 2. ATOMIC CHECK_RATE_LIMIT STORED FUNCTION
-- -------------------------------------------------------------
-- Atomic function that checks, creates, or increments the rate limit counter.
-- Returns jsonb:
--   - allowed: boolean
--   - remaining: int (remaining attempts in this window)
--   - retry_after_seconds: int (seconds until the window resets, if disallowed)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key text,
    p_max int,
    p_window_seconds int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now timestamptz := clock_timestamp();
    v_window_interval interval := (p_window_seconds || ' seconds')::interval;
    v_rec record;
    v_retry_after int := 0;
BEGIN
    -- Transaction-level advisory lock using 32-bit hash of key
    -- Ensures absolute serialization across concurrent requests for the exact same key
    PERFORM pg_advisory_xact_lock(hashtext('ratelimit:' || p_key));

    -- Lock the specific row if present
    SELECT * INTO v_rec
    FROM public.rate_limits
    WHERE key = p_key
    FOR UPDATE;

    -- Scenario 1: First request for this key
    IF NOT FOUND THEN
        INSERT INTO public.rate_limits (key, window_start, count)
        VALUES (p_key, v_now, 1);

        RETURN jsonb_build_object(
            'allowed', true,
            'remaining', GREATEST(0, p_max - 1),
            'retry_after_seconds', 0
        );
    END IF;

    -- Scenario 2: Previous window has expired -> Reset window to now with count = 1
    IF v_rec.window_start + v_window_interval <= v_now THEN
        UPDATE public.rate_limits
        SET window_start = v_now,
            count = 1
        WHERE key = p_key;

        RETURN jsonb_build_object(
            'allowed', true,
            'remaining', GREATEST(0, p_max - 1),
            'retry_after_seconds', 0
        );
    END IF;

    -- Scenario 3: Window is still active and limit has been reached -> Reject request
    IF v_rec.count >= p_max THEN
        v_retry_after := CEIL(EXTRACT(EPOCH FROM (v_rec.window_start + v_window_interval - v_now)))::int;
        IF v_retry_after < 1 THEN
            v_retry_after := 1;
        END IF;

        RETURN jsonb_build_object(
            'allowed', false,
            'remaining', 0,
            'retry_after_seconds', v_retry_after
        );
    END IF;

    -- Scenario 4: Window is active and under limit -> Increment counter
    UPDATE public.rate_limits
    SET count = v_rec.count + 1
    WHERE key = p_key;

    RETURN jsonb_build_object(
        'allowed', true,
        'remaining', GREATEST(0, p_max - (v_rec.count + 1)),
        'retry_after_seconds', 0
    );
END;
$$;

-- Revoke execute from public/anon/authenticated and grant strictly to service_role
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;
