-- Snapshot relationship balances at session termination to support undo.
CREATE TABLE IF NOT EXISTS public.session_balance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, opponent_id)
);

ALTER TABLE public.session_balance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view session balance snapshots"
ON public.session_balance_snapshots
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert session balance snapshots"
ON public.session_balance_snapshots
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can delete session balance snapshots"
ON public.session_balance_snapshots
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_session_balance_snapshots_session_id
ON public.session_balance_snapshots(session_id);

-- Replace terminate function to capture snapshots before reset.
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

  IF NOT has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can terminate game sessions.';
  END IF;

  SELECT id INTO v_session_id
  FROM game_sessions
  WHERE is_active = true
  ORDER BY started_at DESC
  LIMIT 1;

  IF v_session_id IS NULL THEN
    INSERT INTO game_sessions (is_active) VALUES (true)
    RETURNING id INTO v_session_id;
  END IF;

  DELETE FROM session_balance_snapshots WHERE session_id = v_session_id;

  INSERT INTO session_balance_snapshots (session_id, player_id, opponent_id, balance)
  SELECT v_session_id, player_id, opponent_id, balance
  FROM domy_relationships;

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

  UPDATE game_sessions
  SET is_active = false,
      ended_at = now(),
      ended_by = v_caller_id
  WHERE id = v_session_id;

  UPDATE domy_relationships SET balance = 0, updated_at = now() WHERE true;

  DELETE FROM pending_updates WHERE true;

  INSERT INTO game_sessions (is_active) VALUES (true);

  RETURN v_session_id;
END;
$function$;

-- Undo the latest termination within 72 hours.
CREATE OR REPLACE FUNCTION public.undo_last_termination()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid;
  v_session_id uuid;
  v_ended_at timestamp with time zone;
  v_snapshot_count integer;
BEGIN
  v_caller_id := auth.uid();

  IF NOT has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can undo a termination.';
  END IF;

  SELECT id, ended_at
  INTO v_session_id, v_ended_at
  FROM game_sessions
  WHERE is_active = false
    AND ended_at IS NOT NULL
  ORDER BY ended_at DESC
  LIMIT 1;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'No terminated session found to undo.';
  END IF;

  IF v_ended_at < now() - interval '72 hours' THEN
    RAISE EXCEPTION 'Undo window expired. You can only undo within 72 hours.';
  END IF;

  SELECT COUNT(*) INTO v_snapshot_count
  FROM session_balance_snapshots
  WHERE session_id = v_session_id;

  IF v_snapshot_count = 0 THEN
    RAISE EXCEPTION 'No balance snapshot found for this session. Undo is unavailable.';
  END IF;

  IF EXISTS (SELECT 1 FROM domy_relationships WHERE balance <> 0) THEN
    RAISE EXCEPTION 'Cannot undo: current session already has balance changes.';
  END IF;

  IF EXISTS (SELECT 1 FROM pending_updates) THEN
    RAISE EXCEPTION 'Cannot undo: there are pending update requests in the current session.';
  END IF;

  DELETE FROM domy_relationships WHERE true;

  INSERT INTO domy_relationships (player_id, opponent_id, balance, updated_at)
  SELECT player_id, opponent_id, balance, now()
  FROM session_balance_snapshots
  WHERE session_id = v_session_id;

  DELETE FROM session_scores WHERE session_id = v_session_id;

  DELETE FROM game_sessions
  WHERE is_active = true
    AND id <> v_session_id;

  UPDATE game_sessions
  SET is_active = true,
      ended_at = NULL,
      ended_by = NULL
  WHERE id = v_session_id;

  DELETE FROM session_balance_snapshots WHERE session_id = v_session_id;

  RETURN v_session_id;
END;
$function$;
