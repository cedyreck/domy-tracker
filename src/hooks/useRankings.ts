import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankedPlayer {
  id: string;
  username: string;
  avatar_url: string | null;
  total_balance: number;
  rank: number;
}

export const useRankings = () => {
  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url");

      if (profilesError) throw profilesError;

      // Then get all relationships to calculate totals
      const { data: relationships, error: relError } = await supabase
        .from("domy_relationships")
        .select("player_id, balance");

      if (relError) throw relError;

      // Calculate total balance for each player
      const balanceMap = new Map<string, number>();
      relationships.forEach((rel) => {
        const current = balanceMap.get(rel.player_id) || 0;
        balanceMap.set(rel.player_id, current + rel.balance);
      });

      // Build ranked players array
      const rankedPlayers: RankedPlayer[] = profiles.map((profile) => ({
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        total_balance: balanceMap.get(profile.id) || 0,
        rank: 0,
      }));

      // Sort by total balance (descending)
      rankedPlayers.sort((a, b) => b.total_balance - a.total_balance);

      // Assign ranks
      rankedPlayers.forEach((player, index) => {
        player.rank = index + 1;
      });

      return rankedPlayers;
    },
  });

  return { rankings, isLoading };
};
