import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Trophy, Medal, Award } from "lucide-react";

interface RankingCardProps {
  rank: number;
  username: string;
  avatarUrl?: string | null;
  totalBalance: number;
  isCurrentUser?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />;
    default:
      return null;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "border-yellow-500/30 bg-yellow-500/5";
    case 2:
      return "border-gray-400/30 bg-gray-400/5";
    case 3:
      return "border-amber-600/30 bg-amber-600/5";
    default:
      return "";
  }
};

export const RankingCard = ({
  rank,
  username,
  avatarUrl,
  totalBalance,
  isCurrentUser,
}: RankingCardProps) => {
  const getBalanceColor = (bal: number) => {
    if (bal > 0) return "text-success";
    if (bal < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const formatBalance = (bal: number) => {
    if (bal > 0) return `+${bal}`;
    return bal.toString();
  };

  return (
    <GlassCard
      className={cn(
        "transition-all",
        getRankStyle(rank),
        isCurrentUser && "ring-2 ring-primary/50"
      )}
    >
      <GlassCardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          {/* Rank */}
          <div className="flex h-10 w-10 items-center justify-center">
            {getRankIcon(rank) || (
              <span className="text-lg font-bold text-muted-foreground">
                #{rank}
              </span>
            )}
          </div>

          {/* Avatar & Name */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={avatarUrl || ""} alt={username} />
              <AvatarFallback className="bg-muted">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className={cn("font-semibold", isCurrentUser && "text-primary")}>
                {username}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Total Balance */}
        <div
          className={cn(
            "text-2xl font-bold",
            getBalanceColor(totalBalance)
          )}
        >
          {formatBalance(totalBalance)}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
};
