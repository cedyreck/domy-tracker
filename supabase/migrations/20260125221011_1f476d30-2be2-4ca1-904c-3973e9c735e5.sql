-- Drop and recreate approve_pending_update to fix auth.uid() context issue
CREATE OR REPLACE FUNCTION public.approve_pending_update(p_pending_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    v_pending pending_updates%ROWTYPE;
    v_caller_id uuid;
BEGIN
    -- Get the caller's ID first (before any other operations)
    v_caller_id := auth.uid();
    
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get and lock the pending update
    SELECT * INTO v_pending
    FROM pending_updates
    WHERE id = p_pending_id AND status = 'pending'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending update not found or already resolved';
    END IF;
    
    -- Verify the caller is the opponent
    IF v_caller_id != v_pending.opponent_id THEN
        RAISE EXCEPTION 'Only the opponent can approve this update';
    END IF;
    
    -- Apply the balance update using existing function
    PERFORM update_domy_balance(v_pending.requester_id, v_pending.opponent_id, v_pending.proposed_balance);
    
    -- Mark as approved
    UPDATE pending_updates
    SET status = 'approved', resolved_at = now()
    WHERE id = p_pending_id;
END;
$$;

-- Drop and recreate reject_pending_update to fix auth.uid() context issue
CREATE OR REPLACE FUNCTION public.reject_pending_update(p_pending_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    v_pending pending_updates%ROWTYPE;
    v_caller_id uuid;
BEGIN
    -- Get the caller's ID first (before any other operations)
    v_caller_id := auth.uid();
    
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get the pending update
    SELECT * INTO v_pending
    FROM pending_updates
    WHERE id = p_pending_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending update not found or already resolved';
    END IF;
    
    -- Verify the caller is the opponent
    IF v_caller_id != v_pending.opponent_id THEN
        RAISE EXCEPTION 'Only the opponent can reject this update';
    END IF;
    
    -- Mark as rejected
    UPDATE pending_updates
    SET status = 'rejected', resolved_at = now()
    WHERE id = p_pending_id;
END;
$$;