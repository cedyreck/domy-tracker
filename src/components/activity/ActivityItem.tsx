import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, User } from "lucide-react";

interface ActivityItemProps {
  playerUsername: string;
  playerAvatar?: string | null;
  opponentUsername: string;
  opponentAvatar?: string | null;
  oldValue: number;
  newValue: number;
  createdAt: string;
  isCurrentUser?: boolean;
}

export const ActivityItem = ({
  playerUsername,
  playerAvatar,
  opponentUsername,
  opponentAvatar,
  oldValue,
  newValue,
  createdAt,
  isCurrentUser = false,
}: ActivityItemProps) => {
  const getValueColor = (val: number) => {
    if (val > 0) return "text-success";
    if (val < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const formatValue = (val: number) => {
    if (val > 0) return `+${val}`;
    return val.toString();
  };

  const change = newValue - oldValue;
  const changeStr = change > 0 ? `+${change}` : change.toString();

  return (
    <GlassCard 
      className={cn(
        "animate-fade-in transition-all",
        isCurrentUser && "ring-2 ring-primary/40 bg-primary/5"
      )}
    >
      <GlassCardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* Player Avatar */}
          <div className="relative">
            <Avatar className={cn(
              "h-9 w-9 border",
              isCurrentUser ? "border-primary" : "border-border"
            )}>
              <AvatarImage src={playerAvatar || ""} alt={playerUsername} />
              <AvatarFallback className={cn(
                "text-sm",
                isCurrentUser ? "bg-primary/20 text-primary" : "bg-muted"
              )}>
                {playerUsername.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isCurrentUser && (
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                <User className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className={cn(
              "font-medium",
              isCurrentUser && "text-primary"
            )}>
              {isCurrentUser ? "You" : playerUsername}
            </span>
            <span className="text-muted-foreground text-sm">vs</span>
            <div className="flex items-center gap-1">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={opponentAvatar || ""} alt={opponentUsername} />
                <AvatarFallback className="text-xs bg-muted">
                  {opponentUsername.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{opponentUsername}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Balance Change */}
          <div className="flex items-center gap-2 text-sm">
            <span className={getValueColor(oldValue)}>{formatValue(oldValue)}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className={getValueColor(newValue)}>{formatValue(newValue)}</span>
            <span
              className={cn(
                "ml-1 text-xs px-2 py-0.5 rounded-full",
                change > 0 && "bg-success/20 text-success",
                change < 0 && "bg-destructive/20 text-destructive",
                change === 0 && "bg-muted text-muted-foreground"
              )}
            >
              {changeStr}
            </span>
          </div>

          {/* Timestamp */}
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
};
