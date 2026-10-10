-- CTCE Hall Portal: Stored Functions with pg_advisory_xact_lock & Security Definers

-- -------------------------------------------------------------
-- 1. ALLOCATE_HALL(p_applicant)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.allocate_hall(p_applicant uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_applicant record;
    v_portal_open boolean;
    v_mode text;
    v_existing_alloc record;
    v_target_hall record;
    v_is_new boolean := false;
BEGIN
    -- Advisory transaction lock to prevent race conditions during concurrent allocations
    PERFORM pg_advisory_xact_lock(hashtext('allocate'));

    -- Check applicant exists & phone is verified
    SELECT * INTO v_applicant FROM public.applicants WHERE id = p_applicant;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Applicant % not found', p_applicant;
    END IF;

    IF v_applicant.phone_verified_at IS NULL THEN
        RAISE EXCEPTION 'Applicant phone is not verified. Allocation refused.';
    END IF;

    -- Idempotency check: If already allocated, return existing hall and is_new = false
    SELECT a.*, h.name as hall_name, h.colour as hall_colour 
    INTO v_existing_alloc
    FROM public.allocations a
    JOIN public.halls h ON h.id = a.hall_id
    WHERE a.applicant_id = p_applicant;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'status', 'allocated',
            'is_new', false,
            'hall_id', v_existing_alloc.hall_id,
            'hall_name', v_existing_alloc.hall_name,
            'hall_colour', v_existing_alloc.hall_colour
        );
    END IF;

    -- Check portal state
    SELECT portal_open, allocation_mode INTO v_portal_open, v_mode FROM public.settings WHERE id = 1;
    IF NOT v_portal_open THEN
        RAISE EXCEPTION 'Hall allocation portal is currently closed.';
    END IF;

    -- Find available hall
    -- Balanced Mode: Active hall with space and the most free spaces, ties by sort_order
    -- Sequential Mode: First active hall by sort_order with space
    IF v_mode = 'balanced' THEN
        SELECT h.*, (h.capacity - COALESCE(occ.c, 0)) as free_spaces
        INTO v_target_hall
        FROM public.halls h
        LEFT JOIN (
            SELECT hall_id, count(*)::int as c 
            FROM public.allocations 
            GROUP BY hall_id
        ) occ ON occ.hall_id = h.id
        WHERE h.active = true AND (h.capacity - COALESCE(occ.c, 0)) > 0
        ORDER BY free_spaces DESC, h.sort_order ASC
        LIMIT 1;
    ELSE
        SELECT h.*
        INTO v_target_hall
        FROM public.halls h
        LEFT JOIN (
            SELECT hall_id, count(*)::int as c 
            FROM public.allocations 
            GROUP BY hall_id
        ) occ ON occ.hall_id = h.id
        WHERE h.active = true AND (h.capacity - COALESCE(occ.c, 0)) > 0
        ORDER BY h.sort_order ASC
        LIMIT 1;
    END IF;

    -- If no space in any active hall, mark applicant as waitlisted
    IF v_target_hall IS NULL THEN
        UPDATE public.applicants 
        SET status = 'waitlisted' 
        WHERE id = p_applicant;

        INSERT INTO public.audit_log (actor_type, actor_id, action, detail, ip_hash)
        VALUES ('system', p_applicant::text, 'WAITLISTED', jsonb_build_object('reason', 'all_halls_at_capacity'), 'server');

        RETURN jsonb_build_object(
            'status', 'waitlisted',
            'is_new', false,
            'hall_id', null,
            'hall_name', null,
            'hall_colour', null
        );
    END IF;

    -- Insert allocation
    INSERT INTO public.allocations (applicant_id, hall_id, method, allocated_by)
    VALUES (p_applicant, v_target_hall.id, 'auto', null);

    UPDATE public.applicants 
    SET status = 'allocated' 
    WHERE id = p_applicant;

    v_is_new := true;

    INSERT INTO public.audit_log (actor_type, actor_id, action, detail, ip_hash)
    VALUES ('system', p_applicant::text, 'AUTO_ALLOCATE_HALL', jsonb_build_object('hall_id', v_target_hall.id, 'hall_name', v_target_hall.name), 'server');

    RETURN jsonb_build_object(
        'status', 'allocated',
        'is_new', v_is_new,
        'hall_id', v_target_hall.id,
        'hall_name', v_target_hall.name,
        'hall_colour', v_target_hall.colour
    );
END;
$$;

-- -------------------------------------------------------------
-- 2. MANUAL_ALLOCATE(p_applicant, p_hall, p_reason)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.manual_allocate(p_applicant uuid, p_hall uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_old_hall_id uuid;
    v_hall record;
    v_occupancy int;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('allocate'));

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrative privileges required.';
    END IF;

    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'A non-empty reason is strictly required for manual hall allocation.';
    END IF;

    SELECT * INTO v_hall FROM public.halls WHERE id = p_hall AND active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target hall % not found or inactive.', p_hall;
    END IF;

    -- Capacity check
    SELECT count(*)::int INTO v_occupancy FROM public.allocations WHERE hall_id = p_hall;
    IF v_occupancy >= v_hall.capacity THEN
        RAISE EXCEPTION 'Hall % is at maximum capacity (% / %)', v_hall.name, v_occupancy, v_hall.capacity;
    END IF;

    -- Check old allocation
    SELECT hall_id INTO v_old_hall_id FROM public.allocations WHERE applicant_id = p_applicant;

    -- Upsert allocation
    INSERT INTO public.allocations (applicant_id, hall_id, method, reason, allocated_by, allocated_at)
    VALUES (p_applicant, p_hall, 'manual', trim(p_reason), auth.uid(), now())
    ON CONFLICT (applicant_id) DO UPDATE SET
        hall_id = EXCLUDED.hall_id,
        method = 'manual',
        reason = EXCLUDED.reason,
        allocated_by = EXCLUDED.allocated_by,
        allocated_at = EXCLUDED.allocated_at;

    UPDATE public.applicants SET status = 'allocated' WHERE id = p_applicant;

    INSERT INTO public.audit_log (actor_type, actor_id, action, detail, ip_hash)
    VALUES ('staff', auth.uid()::text, 'MANUAL_ALLOCATE', jsonb_build_object('applicant_id', p_applicant, 'old_hall_id', v_old_hall_id, 'new_hall_id', p_hall, 'reason', p_reason), 'server');

    RETURN jsonb_build_object(
        'status', 'allocated',
        'hall_id', v_hall.id,
        'hall_name', v_hall.name,
        'hall_colour', v_hall.colour
    );
END;
$$;

-- -------------------------------------------------------------
-- 3. PROCESS_WAITLIST()
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_waitlist()
RETURNS TABLE (applicant_id uuid, full_name text, phone_e164 text, hall_id uuid, hall_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_waitlisted record;
    v_alloc_res jsonb;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('allocate'));

    FOR v_waitlisted IN
        SELECT id, full_name, phone_e164
        FROM public.applicants
        WHERE status = 'waitlisted' AND phone_verified_at IS NOT NULL
        ORDER BY phone_verified_at ASC
    LOOP
        v_alloc_res := public.allocate_hall(v_waitlisted.id);
        IF (v_alloc_res->>'status') = 'allocated' AND (v_alloc_res->>'is_new')::boolean = true THEN
            applicant_id := v_waitlisted.id;
            full_name := v_waitlisted.full_name;
            phone_e164 := v_waitlisted.phone_e164;
            hall_id := (v_alloc_res->>'hall_id')::uuid;
            hall_name := v_alloc_res->>'hall_name';
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- -------------------------------------------------------------
-- 4. SET_HALL_CAPACITY(p_hall, p_capacity)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_hall_capacity(p_hall uuid, p_capacity int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_occ int;
    v_hall record;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only Super Administrators can modify hall capacity.';
    END IF;

    IF p_capacity < 0 THEN
        RAISE EXCEPTION 'Capacity must be greater than or equal to 0.';
    END IF;

    SELECT count(*)::int INTO v_current_occ FROM public.allocations WHERE hall_id = p_hall;
    IF p_capacity < v_current_occ THEN
        RAISE EXCEPTION 'Capacity (%) cannot be lower than current occupancy (%).', p_capacity, v_current_occ;
    END IF;

    UPDATE public.halls 
    SET capacity = p_capacity 
    WHERE id = p_hall 
    RETURNING * INTO v_hall;

    -- Process waitlist to fill new slots
    PERFORM public.process_waitlist();

    INSERT INTO public.audit_log (actor_type, actor_id, action, detail, ip_hash)
    VALUES ('super_admin', auth.uid()::text, 'UPDATE_HALL_CAPACITY', jsonb_build_object('hall_id', p_hall, 'new_capacity', p_capacity), 'server');

    RETURN jsonb_build_object(
        'id', v_hall.id,
        'name', v_hall.name,
        'capacity', v_hall.capacity,
        'occupancy', v_current_occ
    );
END;
$$;

-- Revoke default public execution & grant to service_role and authenticated staff
REVOKE EXECUTE ON FUNCTION public.allocate_hall(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_waitlist() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_hall_capacity(uuid, int) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.allocate_hall(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.manual_allocate(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_hall_capacity(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_waitlist() TO service_role;
