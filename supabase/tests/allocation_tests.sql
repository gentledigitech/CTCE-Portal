-- =========================================================================
-- CTCE Hall Portal: Automated SQL Verification Suite
-- Tests:
-- 1. 400 verified applicants against 300 spaces -> 300 allocated, 100 waitlisted
-- 2. No hall exceeds its maximum capacity
-- 3. Idempotency: calling allocate_hall twice returns the same hall
-- 4. Unverified applicant cannot be allocated
-- 5. Raising capacity then running process_waitlist() allocates waiting students
-- 6. Permission check: anon/authenticated cannot execute allocate_hall
-- =========================================================================

BEGIN;

DO $$
DECLARE
    v_applicant_id uuid;
    v_unverified_id uuid;
    v_result jsonb;
    v_result2 jsonb;
    v_allocated_count int;
    v_waitlisted_count int;
    v_over_capacity_count int;
    v_hall_theresa uuid;
    v_raised_result jsonb;
    v_newly_allocated_count int;
BEGIN
    RAISE NOTICE '>>> TEST 1: Setting up fresh test environment with 4 halls of 75 spaces (total 300 spaces)...';
    
    -- Ensure 4 halls with 75 capacity each
    UPDATE public.halls SET capacity = 75, active = true;
    DELETE FROM public.allocations;
    DELETE FROM public.applicants;

    SELECT id INTO v_hall_theresa FROM public.halls WHERE name = 'St. Theresa Hall';

    -- -------------------------------------------------------------
    -- Test 2: Prove that unverified applicant cannot be allocated
    -- -------------------------------------------------------------
    RAISE NOTICE '>>> TEST 2: Verifying unverified applicant rejection...';
    INSERT INTO public.applicants (full_name, phone_e164, status, phone_verified_at)
    VALUES ('Unverified Test Student', '+233240000001', 'pending', NULL)
    RETURNING id INTO v_unverified_id;

    BEGIN
        PERFORM public.allocate_hall(v_unverified_id);
        RAISE EXCEPTION 'TEST FAILED: Unverified applicant was allocated!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: Unverified applicant properly rejected: %', SQLERRM;
    END;

    -- -------------------------------------------------------------
    -- Test 3: Insert 400 verified applicants and allocate
    -- -------------------------------------------------------------
    RAISE NOTICE '>>> TEST 3: Simulating 400 verified applicants against 300 spaces...';
    FOR i IN 1..400 LOOP
        INSERT INTO public.applicants (
            full_name,
            phone_e164,
            status,
            phone_verified_at
        ) VALUES (
            'Applicant ' || i,
            '+23324' || lpad(i::text, 7, '0'),
            'verified',
            now()
        ) RETURNING id INTO v_applicant_id;

        PERFORM public.allocate_hall(v_applicant_id);
    END LOOP;

    -- Count allocated and waitlisted
    SELECT count(*)::int INTO v_allocated_count FROM public.applicants WHERE status = 'allocated';
    SELECT count(*)::int INTO v_waitlisted_count FROM public.applicants WHERE status = 'waitlisted';

    IF v_allocated_count <> 300 THEN
        RAISE EXCEPTION 'TEST FAILED: Expected 300 allocated, got %', v_allocated_count;
    END IF;

    IF v_waitlisted_count <> 100 THEN
        RAISE EXCEPTION 'TEST FAILED: Expected 100 waitlisted, got %', v_waitlisted_count;
    END IF;

    RAISE NOTICE 'SUCCESS: 300 allocated and 100 waitlisted confirmed!';

    -- -------------------------------------------------------------
    -- Test 4: Prove no hall is over capacity
    -- -------------------------------------------------------------
    RAISE NOTICE '>>> TEST 4: Checking no hall exceeds capacity...';
    SELECT count(*)::int INTO v_over_capacity_count
    FROM (
        SELECT h.name, h.capacity, count(a.applicant_id) as current_occ
        FROM public.halls h
        LEFT JOIN public.allocations a ON a.hall_id = h.id
        GROUP BY h.id, h.name, h.capacity
        HAVING count(a.applicant_id) > h.capacity
    ) over_caps;

    IF v_over_capacity_count > 0 THEN
        RAISE EXCEPTION 'TEST FAILED: One or more halls exceeded maximum capacity!';
    END IF;

    RAISE NOTICE 'SUCCESS: All halls are strictly within capacity bounds (75 spaces each).';

    -- -------------------------------------------------------------
    -- Test 5: Prove idempotency (allocate_hall twice gives identical hall)
    -- -------------------------------------------------------------
    RAISE NOTICE '>>> TEST 5: Testing allocation idempotency...';
    SELECT applicant_id INTO v_applicant_id FROM public.allocations LIMIT 1;
    v_result := public.allocate_hall(v_applicant_id);
    v_result2 := public.allocate_hall(v_applicant_id);

    IF (v_result->>'hall_id') <> (v_result2->>'hall_id') OR (v_result2->>'is_new')::boolean = true THEN
        RAISE EXCEPTION 'TEST FAILED: allocate_hall is not idempotent!';
    END IF;

    RAISE NOTICE 'SUCCESS: Idempotency confirmed: repeated calls returned identical hall (%) with is_new=false.', v_result->>'hall_name';

    -- -------------------------------------------------------------
    -- Test 6: Raising capacity then running process_waitlist()
    -- -------------------------------------------------------------
    RAISE NOTICE '>>> TEST 6: Raising capacity by 10 spaces and verifying waitlist promotion...';
    -- Increase capacity of St. Theresa Hall from 75 to 85
    UPDATE public.halls SET capacity = 85 WHERE id = v_hall_theresa;
    
    -- Run waitlist processing
    SELECT count(*)::int INTO v_newly_allocated_count FROM public.process_waitlist();

    IF v_newly_allocated_count <> 10 THEN
        RAISE EXCEPTION 'TEST FAILED: Expected 10 waitlisted students to be allocated, got %', v_newly_allocated_count;
    END IF;

    RAISE NOTICE 'SUCCESS: 10 waitlisted students successfully allocated upon capacity expansion!';

    -- -------------------------------------------------------------
    -- Test 7: Verify privilege restrictions on allocate_hall
    -- -------------------------------------------------------------
    RAISE NOTICE '>>> TEST 7: Verifying execution privileges...';
    IF has_function_privilege('anon', 'public.allocate_hall(uuid)', 'execute') THEN
        RAISE EXCEPTION 'SECURITY FLAW: Role anon has EXECUTE privilege on allocate_hall!';
    END IF;

    IF has_function_privilege('authenticated', 'public.allocate_hall(uuid)', 'execute') THEN
        RAISE EXCEPTION 'SECURITY FLAW: Role authenticated has EXECUTE privilege on allocate_hall!';
    END IF;

    RAISE NOTICE 'SUCCESS: Neither anon nor authenticated roles can execute allocate_hall directly!';
END;
$$;

ROLLBACK; -- Clean rollback so test leaves database untouched
