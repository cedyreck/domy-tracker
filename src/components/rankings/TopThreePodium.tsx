import { Crown, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { RankedPlayer } from "@/hooks/useRankings";

interface TopThreePodiumProps {
  players: RankedPlayer[];
  currentUserId?: string;
}

const podiumConfig = [
  {
    rank: 1,
    icon: Crown,
    gradient: "from-yellow-400 to-amber-500",
    bgGradient: "from-yellow-500/20 to-amber-500/10",
    ringColor: "ring-yellow-400/50",
    iconColor: "text-yellow-400",
    order: "order-2",
    scale: "scale-105",
  },
  {
    rank: 2,
    icon: Medal,
    gradient: "from-slate-300 to-slate-400",
    bgGradient: "from-slate-400/20 to-slate-500/10",
    ringColor: "ring-slate-400/50",
    iconColor: "text-slate-400",
    order: "order-1",
    scale: "",
  },
  {
    rank: 3,
    icon: Medal,
    gradient: "from-amber-600 to-amber-700",
    bgGradient: "from-amber-600/20 to-amber-700/10",
    ringColor: "ring-amber-600/50",
    iconColor: "text-amber-600",
    order: "order-3",
    scale: "",
  },
];

export const TopThreePodium = ({ players, currentUserId }: TopThreePodiumProps) => {
  const topThree = players.slice(0, 3);

  if (topThree.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-end justify-center gap-4 mb-8">
      {podiumConfig.map((config) => {
        const player = topThree.find((p) => p.rank === config.rank);
        if (!player) return null;

        const isCurrentUser = player.id === currentUserId;
        const Icon = config.icon;

        return (
          <div key={config.rank} className={cn("w-full sm:w-40", config.order)}>
            <GlassCard
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:scale-105",
                config.scale,
                isCurrentUser && "ring-2 ring-primary"
              )}
            >
              <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", config.bgGradient)} />
              <GlassCardContent className="p-4 relative flex flex-col items-center text-center">
                {/* Rank Badge */}
                <div
                  className={cn(
                    "absolute -top-1 -right-1 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg",
                    config.gradient
                  )}
                >
                  <span className="text-sm font-bold text-background">{config.rank}</span>
                </div>

                {/* Icon */}
                <Icon className={cn("h-6 w-6 mb-2", config.iconColor)} />

                {/* Avatar */}
                <Avatar className={cn("h-16 w-16 ring-2 mb-3", config.ringColor)}>
                  <AvatarImage src={player.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                    {player.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Username */}
                <p className={cn(
                  "font-semibold text-sm truncate w-full",
                  isCurrentUser && "text-primary"
                )}>
                  {player.username}
                </p>

                {/* Score */}
                <p className={cn(
                  "text-lg font-bold mt-1",
                  player.total_balance >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {player.total_balance >= 0 ? "+" : ""}{player.total_balance}
                </p>
              </GlassCardContent>
            </GlassCard>
          </div>
        );
      })}
    </div>
  );
};
