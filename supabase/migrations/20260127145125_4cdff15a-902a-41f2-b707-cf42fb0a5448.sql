-- Create request_history table to track accepted/rejected requests
CREATE TABLE public.request_history (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id uuid NOT NULL,
    opponent_id uuid NOT NULL,
    proposed_balance integer NOT NULL,
    current_balance integer NOT NULL DEFAULT 0,
    status text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    resolved_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.request_history ENABLE ROW LEVEL SECURITY;

-- Create policies for request_history
CREATE POLICY "Anyone can view request history" 
ON public.request_history 
FOR SELECT 
USING (true);

-- Only the system (via security definer functions) can insert
CREATE POLICY "System can insert request history" 
ON public.request_history 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add foreign key references to profiles
ALTER TABLE public.request_history
ADD CONSTRAINT request_history_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.request_history
ADD CONSTRAINT request_history_opponent_id_fkey 
FOREIGN KEY (opponent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update approve_pending_update to log history before deleting
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
    
    -- Log to history BEFORE applying the update
    INSERT INTO request_history (requester_id, opponent_id, proposed_balance, current_balance, status, created_at, resolved_at)
    VALUES (v_pending.requester_id, v_pending.opponent_id, v_pending.proposed_balance, v_pending.current_balance, 'approved', v_pending.created_at, now());
    
    -- Apply the balance update
    PERFORM update_domy_balance(v_pending.requester_id, v_pending.opponent_id, v_pending.proposed_balance);
    
    -- DELETE the pending update row
    DELETE FROM pending_updates WHERE id = p_pending_id;
END;
$function$;

-- Update reject_pending_update to log history before deleting
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
    
    -- Log to history BEFORE deleting
    INSERT INTO request_history (requester_id, opponent_id, proposed_balance, current_balance, status, created_at, resolved_at)
    VALUES (v_pending.requester_id, v_pending.opponent_id, v_pending.proposed_balance, v_pending.current_balance, 'rejected', v_pending.created_at, now());
    
    -- DELETE the pending update row
    DELETE FROM pending_updates WHERE id = p_pending_id;
END;
$function$;