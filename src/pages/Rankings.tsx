import { useRankings } from "@/hooks/useRankings";
import { useAuth } from "@/contexts/AuthContext";
import { RankingCard } from "@/components/rankings/RankingCard";
import { Loader2, Trophy } from "lucide-react";

const Rankings = () => {
  const { rankings, isLoading } = useRankings();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-text">Rankings</h1>
          <p className="text-muted-foreground">Global leaderboard by total earnings</p>
        </div>
      </div>

      <div className="grid gap-3">
        {rankings.map((player) => (
          <RankingCard
            key={player.id}
            rank={player.rank}
            username={player.username}
            avatarUrl={player.avatar_url}
            totalBalance={player.total_balance}
            isCurrentUser={player.id === user?.id}
          />
        ))}
      </div>
    </div>
  );
};

export default Rankings;
