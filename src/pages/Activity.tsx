import { useState, useMemo } from "react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { ActivityItem } from "@/components/activity/ActivityItem";
import { ActivityFilter, ActivityFilterType } from "@/components/activity/ActivityFilter";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Loader2, Activity as ActivityIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Activity = () => {
  const { logs, isLoading } = useActivityLogs();
  const { user } = useAuth();
  const [filter, setFilter] = useState<ActivityFilterType>("all");

  const filteredLogs = useMemo(() => {
    if (!user?.id) return logs;
    
    switch (filter) {
      case "mine":
        return logs.filter((log) => log.player_id === user.id);
      case "others":
        return logs.filter((log) => log.player_id !== user.id);
      default:
        return logs;
    }
  }, [logs, filter, user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ActivityIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">Activity Feed</h1>
            <p className="text-muted-foreground">Recent balance updates</p>
          </div>
        </div>
        
        <ActivityFilter filter={filter} onFilterChange={setFilter} />
      </div>

      {filteredLogs.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {filter === "all" ? "No activity yet" : `No ${filter === "mine" ? "your" : "others'"} activity found`}
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid gap-3">
          {filteredLogs.map((log) => (
            <ActivityItem
              key={log.id}
              playerUsername={log.player?.username || "Unknown"}
              playerAvatar={log.player?.avatar_url}
              opponentUsername={log.opponent?.username || "Unknown"}
              opponentAvatar={log.opponent?.avatar_url}
              oldValue={log.old_value}
              newValue={log.new_value}
              createdAt={log.created_at}
              isCurrentUser={log.player_id === user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Activity;
