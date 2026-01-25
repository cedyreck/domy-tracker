import { useActivityLogs } from "@/hooks/useActivityLogs";
import { ActivityItem } from "@/components/activity/ActivityItem";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Loader2, Activity as ActivityIcon } from "lucide-react";

const Activity = () => {
  const { logs, isLoading } = useActivityLogs();

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
        <ActivityIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-text">Activity Feed</h1>
          <p className="text-muted-foreground">Recent balance updates</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <p className="text-muted-foreground">No activity yet</p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid gap-3">
          {logs.map((log) => (
            <ActivityItem
              key={log.id}
              playerUsername={log.player?.username || "Unknown"}
              playerAvatar={log.player?.avatar_url}
              opponentUsername={log.opponent?.username || "Unknown"}
              opponentAvatar={log.opponent?.avatar_url}
              oldValue={log.old_value}
              newValue={log.new_value}
              createdAt={log.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Activity;
