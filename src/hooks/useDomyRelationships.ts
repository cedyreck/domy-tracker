import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DomyRelationship {
  id: string;
  player_id: string;
  opponent_id: string;
  balance: number;
  updated_at: string;
  opponent?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useDomyRelationships = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ["domy-relationships", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("domy_relationships")
        .select(
          `
          id,
          player_id,
          opponent_id,
          balance,
          updated_at,
          opponent:profiles!domy_relationships_opponent_id_fkey (
            id,
            username,
            avatar_url
          )
        `
        )
        .eq("player_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as DomyRelationship[];
    },
    enabled: !!user?.id,
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["all-players", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .neq("id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateBalance = useMutation({
    mutationFn: async ({
      opponentId,
      newBalance,
    }: {
      opponentId: string;
      newBalance: number;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.rpc("update_domy_balance", {
        p_player_id: user.id,
        p_opponent_id: opponentId,
        p_new_balance: newBalance,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domy-relationships"] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });

  // Set up realtime subscription for domy_relationships
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("domy-relationships-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "domy_relationships",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["domy-relationships"] });
          queryClient.invalidateQueries({ queryKey: ["rankings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    relationships,
    allPlayers,
    isLoading,
    updateBalance,
  };
};
