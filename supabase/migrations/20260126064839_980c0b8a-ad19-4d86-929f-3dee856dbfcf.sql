-- Update approve_pending_update to DELETE the row after processing
CREATE OR REPLACE FUNCTION public.approve_pending_update(p_pending_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_pending pending_updates%ROWTYPE;
    v_caller_id uuid;
BEGIN
    v_caller_id := auth.uid();
    
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required. Please log in and try again.';
    END IF;

    -- Get and lock the pending update
    SELECT * INTO v_pending
    FROM pending_updates
    WHERE id = p_pending_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found. It may have been cancelled or already resolved.';
    END IF;
    
    IF v_pending.status != 'pending' THEN
        RAISE EXCEPTION 'This request has already been % and cannot be changed.', v_pending.status;
    END IF;
    
    -- Verify the caller is the opponent
    IF v_caller_id != v_pending.opponent_id THEN
        RAISE EXCEPTION 'Only the recipient can approve this request.';
    END IF;
    
    -- Apply the balance update
    PERFORM update_domy_balance(v_pending.requester_id, v_pending.opponent_id, v_pending.proposed_balance);
    
    -- DELETE the pending update row instead of just marking as approved
    DELETE FROM pending_updates WHERE id = p_pending_id;
END;
$function$;

-- Update reject_pending_update to DELETE the row after processing
CREATE OR REPLACE FUNCTION public.reject_pending_update(p_pending_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_pending pending_updates%ROWTYPE;
    v_caller_id uuid;
BEGIN
    v_caller_id := auth.uid();
    
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required. Please log in and try again.';
    END IF;

    -- Get the pending update
    SELECT * INTO v_pending
    FROM pending_updates
    WHERE id = p_pending_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found. It may have been cancelled or already resolved.';
    END IF;
    
    IF v_pending.status != 'pending' THEN
        RAISE EXCEPTION 'This request has already been % and cannot be changed.', v_pending.status;
    END IF;
    
    -- Verify the caller is the opponent
    IF v_caller_id != v_pending.opponent_id THEN
        RAISE EXCEPTION 'Only the recipient can reject this request.';
    END IF;
    
    -- DELETE the pending update row instead of just marking as rejected
    DELETE FROM pending_updates WHERE id = p_pending_id;
END;
$function$;