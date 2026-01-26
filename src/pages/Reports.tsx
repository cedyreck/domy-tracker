import { useState } from "react";
import { useGameSessions, GameSession } from "@/hooks/useGameSessions";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, FileText, Trophy, Medal, Award, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return null;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-yellow-500/10 border-yellow-500/30";
    case 2:
      return "bg-gray-400/10 border-gray-400/30";
    case 3:
      return "bg-amber-600/10 border-amber-600/30";
    default:
      return "bg-card/30 border-border/50";
  }
};

const Reports = () => {
  const { sessions, loadingSessions, useSessionScores } = useGameSessions();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const { data: scores = [], isLoading: loadingScores } = useSessionScores(selectedSessionId);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-success";
    if (balance < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const formatBalance = (balance: number) => {
    if (balance > 0) return `+${balance}`;
    return balance.toString();
  };

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-text">Reports</h1>
          <p className="text-muted-foreground">View historical game session results</p>
        </div>
      </div>

      {/* Session Selector */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Select Game Session
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No completed game sessions yet. Sessions will appear here after an admin ends the current session.
            </p>
          ) : (
            <Select
              value={selectedSessionId || ""}
              onValueChange={(value) => setSelectedSessionId(value)}
            >
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Choose a game session to view..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session, index) => (
                  <SelectItem key={session.id} value={session.id}>
                    Session {sessions.length - index} - Ended{" "}
                    {format(new Date(session.ended_at!), "MMM d, yyyy 'at' h:mm a")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Session Results */}
      {selectedSessionId && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Final Rankings
              {selectedSession && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({format(new Date(selectedSession.started_at), "MMM d")} -{" "}
                  {format(new Date(selectedSession.ended_at!), "MMM d, yyyy")})
                </span>
              )}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {loadingScores ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : scores.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No scores recorded for this session.
              </p>
            ) : (
              <div className="space-y-2">
                {scores.map((score) => (
                  <div
                    key={score.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      getRankStyle(score.rank)
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="flex h-8 w-8 items-center justify-center">
                        {getRankIcon(score.rank) || (
                          <span className="text-sm font-bold text-muted-foreground">
                            #{score.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar & Name */}
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={score.player?.avatar_url || ""} />
                        <AvatarFallback className="bg-muted text-xs">
                          {score.player?.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{score.player?.username || "Unknown"}</span>
                    </div>

                    {/* Score */}
                    <span className={cn("text-lg font-bold", getBalanceColor(score.total_balance))}>
                      {formatBalance(score.total_balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
};

export default Reports;
