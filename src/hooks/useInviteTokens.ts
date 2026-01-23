import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface InviteToken {
  id: string;
  token: string;
  created_by: string | null;
  used_by: string | null;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) result += "-";
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const useInviteTokens = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ["invite-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invite_tokens")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InviteToken[];
    },
  });

  const createToken = useMutation({
    mutationFn: async (expiresAt?: Date) => {
      if (!user?.id) throw new Error("Not authenticated");

      const token = generateToken();
      const { error } = await supabase.from("invite_tokens").insert({
        token,
        created_by: user.id,
        expires_at: expiresAt?.toISOString() || null,
      });

      if (error) throw error;
      return token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-tokens"] });
    },
  });

  const revokeToken = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from("invite_tokens")
        .delete()
        .eq("id", tokenId)
        .is("used_by", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-tokens"] });
    },
  });

  return {
    tokens,
    isLoading,
    createToken,
    revokeToken,
  };
};
