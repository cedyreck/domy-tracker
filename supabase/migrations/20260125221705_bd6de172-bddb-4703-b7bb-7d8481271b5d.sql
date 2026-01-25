-- Drop the unreliable system policy
DROP POLICY IF EXISTS "System can manage all relationships" ON public.domy_relationships;

-- Recreate update_domy_balance to properly bypass RLS for mirrored updates
-- The function is already SECURITY DEFINER, but we need to ensure it can update both sides
CREATE OR REPLACE FUNCTION public.update_domy_balance(p_player_id uuid, p_opponent_id uuid, p_new_balance integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    v_old_balance INTEGER;
BEGIN
    -- Get old balance for logging
    SELECT balance INTO v_old_balance
    FROM domy_relationships
    WHERE player_id = p_player_id AND opponent_id = p_opponent_id;
    
    IF NOT FOUND THEN
        v_old_balance := 0;
        -- Insert both relationships (bypassing RLS since this is SECURITY DEFINER)
        INSERT INTO domy_relationships (player_id, opponent_id, balance)
        VALUES (p_player_id, p_opponent_id, p_new_balance);
        
        INSERT INTO domy_relationships (player_id, opponent_id, balance)
        VALUES (p_opponent_id, p_player_id, -p_new_balance)
        ON CONFLICT (player_id, opponent_id) DO UPDATE
        SET balance = -p_new_balance, updated_at = now();
    ELSE
        -- Update both relationships (bypassing RLS since this is SECURITY DEFINER)
        UPDATE domy_relationships
        SET balance = p_new_balance, updated_at = now()
        WHERE player_id = p_player_id AND opponent_id = p_opponent_id;
        
        UPDATE domy_relationships
        SET balance = -p_new_balance, updated_at = now()
        WHERE player_id = p_opponent_id AND opponent_id = p_player_id;
    END IF;
    
    -- Log the activity
    INSERT INTO activity_logs (player_id, opponent_id, old_value, new_value)
    VALUES (p_player_id, p_opponent_id, v_old_balance, p_new_balance);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_domy_balance(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_pending_update(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_pending_update(uuid) TO authenticated;