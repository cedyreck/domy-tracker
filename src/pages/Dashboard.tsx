import { useDomyRelationships } from "@/hooks/useDomyRelationships";
import { DomyBalanceCard } from "@/components/dashboard/DomyBalanceCard";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { relationships, allPlayers, isLoading, updateBalance } = useDomyRelationships();

  const handleUpdateBalance = async (opponentId: string, newBalance: number) => {
    try {
      await updateBalance.mutateAsync({ opponentId, newBalance });
      toast.success("Balance updated!");
    } catch {
      toast.error("Failed to update balance");
    }
  };

  // Merge existing relationships with players who don't have one yet
  const existingOpponentIds = new Set(relationships.map((r) => r.opponent_id));
  const playersWithoutRelationship = allPlayers.filter(
    (p) => !existingOpponentIds.has(p.id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your domy balance against other players</p>
      </div>

      {relationships.length === 0 && playersWithoutRelationship.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No players yet</h3>
            <p className="text-muted-foreground">Invite other players to start tracking!</p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {relationships.map((rel) => (
            <DomyBalanceCard
              key={rel.id}
              opponentId={rel.opponent_id}
              opponentUsername={rel.opponent?.username || "Unknown"}
              opponentAvatar={rel.opponent?.avatar_url}
              balance={rel.balance}
              onUpdate={handleUpdateBalance}
            />
          ))}
          {playersWithoutRelationship.map((player) => (
            <DomyBalanceCard
              key={player.id}
              opponentId={player.id}
              opponentUsername={player.username}
              opponentAvatar={player.avatar_url}
              balance={0}
              onUpdate={handleUpdateBalance}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
