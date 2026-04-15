import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id: string;
  player_id: string;
  opponent_id: string;
  old_value: number;
  new_value: number;
  created_at: string;
  player?: {
    username: string;
    avatar_url: string | null;
  };
  opponent?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useActivityLogs = (limit = 50) => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(
          `
          id,
          player_id,
          opponent_id,
          old_value,
          new_value,
          created_at,
          player:profiles!activity_logs_player_id_fkey (
            username,
            avatar_url
          ),
          opponent:profiles!activity_logs_opponent_id_fkey (
            username,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  // Set up realtime subscription for activity_logs
  useEffect(() => {
    const channel = supabase
      .channel("activity-logs-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
        },
        () => {
          // Refresh activity logs when new entries are added
          queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, limit]);

  return { logs, isLoading };
};
