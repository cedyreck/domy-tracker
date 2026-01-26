-- Create game_sessions table to track sessions
CREATE TABLE public.game_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    ended_at timestamp with time zone,
    ended_by uuid REFERENCES auth.users(id),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create session_scores table to archive scores when a session ends
CREATE TABLE public.session_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_balance integer NOT NULL DEFAULT 0,
    rank integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_sessions
CREATE POLICY "Anyone can view game sessions"
ON public.game_sessions FOR SELECT
USING (true);

CREATE POLICY "Admins can create game sessions"
ON public.game_sessions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update game sessions"
ON public.game_sessions FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for session_scores
CREATE POLICY "Anyone can view session scores"
ON public.session_scores FOR SELECT
USING (true);

CREATE POLICY "System can insert session scores"
ON public.session_scores FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create function to terminate a game session (admin only)
CREATE OR REPLACE FUNCTION public.terminate_game_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_session_id uuid;
    v_caller_id uuid;
    v_rank integer := 0;
    v_player record;
BEGIN
    v_caller_id := auth.uid();
    
    -- Check if caller is admin
    IF NOT has_role(v_caller_id, 'admin') THEN
        RAISE EXCEPTION 'Only admins can terminate game sessions.';
    END IF;
    
    -- Get the current active session
    SELECT id INTO v_session_id
    FROM game_sessions
    WHERE is_active = true
    ORDER BY started_at DESC
    LIMIT 1;
    
    -- If no active session, create one first then end it (for initial data)
    IF v_session_id IS NULL THEN
        INSERT INTO game_sessions (is_active) VALUES (true)
        RETURNING id INTO v_session_id;
    END IF;
    
    -- Archive current scores by calculating total balance per player
    FOR v_player IN (
        SELECT 
            p.id as player_id,
            COALESCE(SUM(dr.balance), 0) as total_balance
        FROM profiles p
        LEFT JOIN domy_relationships dr ON dr.player_id = p.id
        GROUP BY p.id
        ORDER BY COALESCE(SUM(dr.balance), 0) DESC
    )
    LOOP
        v_rank := v_rank + 1;
        INSERT INTO session_scores (session_id, player_id, total_balance, rank)
        VALUES (v_session_id, v_player.player_id, v_player.total_balance, v_rank);
    END LOOP;
    
    -- Mark session as ended
    UPDATE game_sessions
    SET is_active = false,
        ended_at = now(),
        ended_by = v_caller_id
    WHERE id = v_session_id;
    
    -- Reset all domy_relationships balances to 0
    UPDATE domy_relationships SET balance = 0, updated_at = now();
    
    -- Clear pending updates
    DELETE FROM pending_updates WHERE status = 'pending';
    
    -- Create a new active session
    INSERT INTO game_sessions (is_active) VALUES (true);
    
    RETURN v_session_id;
END;
$function$;

-- Create an initial active session
INSERT INTO game_sessions (is_active) VALUES (true);