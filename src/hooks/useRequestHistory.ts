import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RequestHistoryRecord {
  id: string;
  requester_id: string;
  opponent_id: string;
  proposed_balance: number;
  current_balance: number;
  status: "approved" | "rejected";
  created_at: string;
  resolved_at: string;
  requester?: {
    username: string;
    avatar_url: string | null;
  };
  opponent?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useRequestHistory = (opponentId: string | null, limit = 3) => {
  const { user } = useAuth();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["request-history", user?.id, opponentId, limit],
    queryFn: async () => {
      if (!user?.id || !opponentId) return [];

      // Get history where user is either requester or opponent with this specific player
      const { data, error } = await supabase
        .from("request_history")
        .select(
          `
          id,
          requester_id,
          opponent_id,
          proposed_balance,
          current_balance,
          status,
          created_at,
          resolved_at,
          requester:profiles!request_history_requester_id_fkey (
            username,
            avatar_url
          ),
          opponent:profiles!request_history_opponent_id_fkey (
            username,
            avatar_url
          )
        `
        )
        .or(
          `and(requester_id.eq.${user.id},opponent_id.eq.${opponentId}),and(requester_id.eq.${opponentId},opponent_id.eq.${user.id})`
        )
        .order("resolved_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RequestHistoryRecord[];
    },
    enabled: !!user?.id && !!opponentId,
  });

  return { history, isLoading };
};
