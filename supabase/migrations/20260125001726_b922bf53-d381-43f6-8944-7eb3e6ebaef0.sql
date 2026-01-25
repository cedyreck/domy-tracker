-- Create pending_updates table for approval system
CREATE TABLE public.pending_updates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposed_balance INTEGER NOT NULL,
    current_balance INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (requester_id, opponent_id, status) -- Only one pending request per pair
);

-- Enable RLS
ALTER TABLE public.pending_updates ENABLE ROW LEVEL SECURITY;

-- Everyone can view pending updates (to see incoming requests)
CREATE POLICY "Anyone can view pending updates"
ON public.pending_updates
FOR SELECT
USING (true);

-- Users can create pending updates for themselves
CREATE POLICY "Users can create their own pending updates"
ON public.pending_updates
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Opponents can update (approve/reject) pending requests directed at them
CREATE POLICY "Opponents can resolve pending updates"
ON public.pending_updates
FOR UPDATE
USING (auth.uid() = opponent_id AND status = 'pending');

-- Requesters can delete their own pending requests
CREATE POLICY "Requesters can delete their pending updates"
ON public.pending_updates
FOR DELETE
USING (auth.uid() = requester_id AND status = 'pending');

-- Create function to approve pending update
CREATE OR REPLACE FUNCTION public.approve_pending_update(p_pending_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pending pending_updates%ROWTYPE;
BEGIN
    -- Get and lock the pending update
    SELECT * INTO v_pending
    FROM pending_updates
    WHERE id = p_pending_id AND status = 'pending'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending update not found or already resolved';
    END IF;
    
    -- Verify the caller is the opponent
    IF auth.uid() != v_pending.opponent_id THEN
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

-- Create function to reject pending update
CREATE OR REPLACE FUNCTION public.reject_pending_update(p_pending_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pending pending_updates%ROWTYPE;
BEGIN
    -- Get the pending update
    SELECT * INTO v_pending
    FROM pending_updates
    WHERE id = p_pending_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending update not found or already resolved';
    END IF;
    
    -- Verify the caller is the opponent
    IF auth.uid() != v_pending.opponent_id THEN
        RAISE EXCEPTION 'Only the opponent can reject this update';
    END IF;
    
    -- Mark as rejected
    UPDATE pending_updates
    SET status = 'rejected', resolved_at = now()
    WHERE id = p_pending_id;
END;
$$;