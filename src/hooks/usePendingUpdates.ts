import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PendingUpdate {
  id: string;
  requester_id: string;
  opponent_id: string;
  proposed_balance: number;
  current_balance: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at: string | null;
  requester?: {
    username: string;
    avatar_url: string | null;
  };
  opponent?: {
    username: string;
    avatar_url: string | null;
  };
}

export const usePendingUpdates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get incoming pending requests (where user is the opponent)
  const { data: incomingRequests = [], isLoading: loadingIncoming } = useQuery({
    queryKey: ["pending-updates-incoming", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("pending_updates")
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
          requester:profiles!pending_updates_requester_id_fkey (
            username,
            avatar_url
          )
        `
        )
        .eq("opponent_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingUpdate[];
    },
    enabled: !!user?.id,
  });

  // Get outgoing pending requests (where user is the requester)
  const { data: outgoingRequests = [], isLoading: loadingOutgoing } = useQuery({
    queryKey: ["pending-updates-outgoing", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("pending_updates")
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
          opponent:profiles!pending_updates_opponent_id_fkey (
            username,
            avatar_url
          )
        `
        )
        .eq("requester_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingUpdate[];
    },
    enabled: !!user?.id,
  });

  // Create a pending update request
  const createRequest = useMutation({
    mutationFn: async ({
      opponentId,
      proposedBalance,
      currentBalance,
    }: {
      opponentId: string;
      proposedBalance: number;
      currentBalance: number;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("pending_updates").insert({
        requester_id: user.id,
        opponent_id: opponentId,
        proposed_balance: proposedBalance,
        current_balance: currentBalance,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-updates-outgoing"] });
    },
  });

  // Approve a pending update
  const approveRequest = useMutation({
    mutationFn: async (pendingId: string) => {
      const { error } = await supabase.rpc("approve_pending_update", {
        p_pending_id: pendingId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-updates-incoming"] });
      queryClient.invalidateQueries({ queryKey: ["domy-relationships"] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });

  // Reject a pending update
  const rejectRequest = useMutation({
    mutationFn: async (pendingId: string) => {
      const { error } = await supabase.rpc("reject_pending_update", {
        p_pending_id: pendingId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-updates-incoming"] });
    },
  });

  // Cancel own pending request
  const cancelRequest = useMutation({
    mutationFn: async (pendingId: string) => {
      const { error } = await supabase
        .from("pending_updates")
        .delete()
        .eq("id", pendingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-updates-outgoing"] });
    },
  });

  // Set up realtime subscription for pending_updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("pending-updates-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pending_updates",
        },
        () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["pending-updates-incoming"] });
          queryClient.invalidateQueries({ queryKey: ["pending-updates-outgoing"] });
          queryClient.invalidateQueries({ queryKey: ["domy-relationships"] });
          queryClient.invalidateQueries({ queryKey: ["rankings"] });
          queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    incomingRequests,
    outgoingRequests,
    isLoading: loadingIncoming || loadingOutgoing,
    createRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
  };
};
