import { useInviteTokens } from "@/hooks/useInviteTokens";
import { GenerateTokenForm } from "@/components/admin/GenerateTokenForm";
import { InviteTokenCard } from "@/components/admin/InviteTokenCard";
import { TerminateSessionButton } from "@/components/admin/TerminateSessionButton";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Loader2, Shield, Key, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const { tokens, isLoading, createToken, revokeToken } = useInviteTokens();

  const handleGenerate = async (expiresAt?: Date) => {
    try {
      const token = await createToken.mutateAsync(expiresAt);
      toast.success("Token generated!");
      return token;
    } catch {
      toast.error("Failed to generate token");
      throw new Error("Failed");
    }
  };

  const handleRevoke = async (tokenId: string) => {
    try {
      await revokeToken.mutateAsync(tokenId);
      toast.success("Token revoked");
    } catch {
      toast.error("Failed to revoke token");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage invite tokens and users</p>
        </div>
      </div>

      {/* Game Session Management */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Game Session Management
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                End the current game session to archive all scores and reset balances to zero.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Archived scores will be viewable in the Reports page.
              </p>
            </div>
            <TerminateSessionButton />
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Invite Tokens Section */}
      <div className="grid gap-8 lg:grid-cols-[350px,1fr]">
        <GenerateTokenForm onGenerate={handleGenerate} />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Invite Tokens</h2>
          </div>
          
          <div className="grid gap-3">
            {tokens.map((token) => (
              <InviteTokenCard
                key={token.id}
                token={token.token}
                usedBy={token.used_by}
                usedAt={token.used_at}
                expiresAt={token.expires_at}
                createdAt={token.created_at}
                onRevoke={() => handleRevoke(token.id)}
              />
            ))}
            {tokens.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No tokens generated yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
