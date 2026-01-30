import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GameSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  ended_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SessionScore {
  id: string;
  session_id: string;
  player_id: string;
  total_balance: number;
  rank: number;
  created_at: string;
  paid: boolean;
  paid_at: string | null;
  paid_by: string | null;
  player?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useGameSessions = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Get all completed sessions (for reports)
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["game-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("is_active", false)
        .order("ended_at", { ascending: false });

      if (error) throw error;
      return data as GameSession[];
    },
  });

  // Get current active session
  const { data: activeSession } = useQuery({
    queryKey: ["active-session"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("is_active", true)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as GameSession | null;
    },
  });

  // Get scores for a specific session
  const useSessionScores = (sessionId: string | null) => {
    return useQuery({
      queryKey: ["session-scores", sessionId],
      queryFn: async () => {
        if (!sessionId) return [];

        const { data, error } = await supabase
          .from("session_scores")
          .select(`
            id,
            session_id,
            player_id,
            total_balance,
            rank,
            created_at,
            paid,
            paid_at,
            paid_by,
            player:profiles!session_scores_player_id_fkey (
              username,
              avatar_url
            )
          `)
          .eq("session_id", sessionId)
          .order("rank", { ascending: true });

        if (error) throw error;
        return data as SessionScore[];
      },
      enabled: !!sessionId,
    });
  };

  // Terminate session mutation (admin only)
  const terminateSession = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("terminate_game_session");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
      queryClient.invalidateQueries({ queryKey: ["domy-relationships"] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });

  // Mark score as paid (admin only)
  const markAsPaid = useMutation({
    mutationFn: async (scoreId: string) => {
      const { error } = await supabase
        .from("session_scores")
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          paid_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", scoreId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-scores"] });
    },
  });

  // Mark score as unpaid (admin only)
  const markAsUnpaid = useMutation({
    mutationFn: async (scoreId: string) => {
      const { error } = await supabase
        .from("session_scores")
        .update({
          paid: false,
          paid_at: null,
          paid_by: null,
        })
        .eq("id", scoreId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-scores"] });
    },
  });

  return {
    sessions,
    activeSession,
    loadingSessions,
    useSessionScores,
    terminateSession,
    markAsPaid,
    markAsUnpaid,
    canTerminate: isAdmin,
  };
};
