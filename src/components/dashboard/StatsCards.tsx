import { TrendingUp, TrendingDown, Users, Clock } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalScore: number;
  opponentCount: number;
  pendingCount: number;
}

export const StatsCards = ({ totalScore, opponentCount, pendingCount }: StatsCardsProps) => {
  const isPositive = totalScore >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Score Card */}
      <GlassCard className="relative overflow-hidden">
        <div className={cn(
          "absolute inset-0 opacity-10",
          isPositive ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-rose-600"
        )} />
        <GlassCardContent className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Score</p>
              <p className={cn(
                "text-3xl font-bold mt-1",
                isPositive ? "text-green-500" : "text-red-500"
              )}>
                {isPositive ? "+" : ""}{totalScore}
              </p>
            </div>
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              isPositive ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Opponents Card */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-blue-500 to-indigo-600" />
        <GlassCardContent className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Opponents</p>
              <p className="text-3xl font-bold mt-1 text-foreground">
                {opponentCount}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Pending Requests Card */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-amber-500 to-orange-600" />
        <GlassCardContent className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold mt-1 text-foreground">
                {pendingCount}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};
