import { useRequestHistory } from "@/hooks/useRequestHistory";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Clock, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RequestHistoryHoverCardProps {
  opponentId: string;
  opponentUsername: string;
  opponentAvatar?: string | null;
  children: React.ReactNode;
}

export const RequestHistoryHoverCard = ({
  opponentId,
  opponentUsername,
  opponentAvatar,
  children,
}: RequestHistoryHoverCardProps) => {
  const { history, isLoading } = useRequestHistory(opponentId);
  const { user } = useAuth();

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="w-72 p-0 bg-background/95 backdrop-blur-md border-border/50"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
          <Avatar className="h-6 w-6 border border-border">
            <AvatarImage src={opponentAvatar || ""} alt={opponentUsername} />
            <AvatarFallback className="text-xs bg-muted">
              {opponentUsername.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{opponentUsername}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <History className="h-3 w-3" />
              Recent history
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No request history yet
            </p>
          ) : (
            <div className="space-y-1.5">
              {history.map((record) => {
                const isApproved = record.status === "approved";
                const wasRequester = record.requester_id === user?.id;
                const change = record.proposed_balance - record.current_balance;

                return (
                  <div
                    key={record.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs",
                      isApproved
                        ? "bg-success/10 border border-success/20"
                        : "bg-destructive/10 border border-destructive/20"
                    )}
                  >
                    {/* Status Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center",
                        isApproved
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      )}
                    >
                      {isApproved ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {wasRequester ? "You requested" : `${opponentUsername} requested`}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>{record.current_balance}</span>
                        <span>→</span>
                        <span
                          className={cn(
                            change > 0 ? "text-success" : change < 0 ? "text-destructive" : ""
                          )}
                        >
                          {record.proposed_balance}
                        </span>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex-shrink-0 text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">
                        {formatDistanceToNow(new Date(record.resolved_at), {
                          addSuffix: false,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
