import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Check, X, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PendingUpdate } from "@/hooks/usePendingUpdates";
import { cn } from "@/lib/utils";

interface PendingRequestCardProps {
  request: PendingUpdate;
  type: "incoming" | "outgoing";
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const PendingRequestCard = ({
  request,
  type,
  onApprove,
  onReject,
  onCancel,
  isLoading,
}: PendingRequestCardProps) => {
  const otherUser = type === "incoming" ? request.requester : request.opponent;
  const change = request.proposed_balance - request.current_balance;

  const getValueColor = (val: number) => {
    if (val > 0) return "text-success";
    if (val < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const formatValue = (val: number) => {
    if (val > 0) return `+${val}`;
    return val.toString();
  };

  return (
    <GlassCard className="animate-fade-in border-warning/30">
      <GlassCardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-warning/50">
                <AvatarImage src={otherUser?.avatar_url || ""} alt={otherUser?.username} />
                <AvatarFallback className="bg-warning/20 text-warning">
                  {otherUser?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <Clock className="absolute -bottom-1 -right-1 h-4 w-4 text-warning" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{otherUser?.username || "Unknown"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                  {type === "incoming" ? "Awaiting your approval" : "Pending"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance Change */}
            <div className="flex items-center gap-2 text-sm">
              <span className={getValueColor(request.current_balance)}>
                {formatValue(request.current_balance)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className={getValueColor(request.proposed_balance)}>
                {formatValue(request.proposed_balance)}
              </span>
              <span
                className={cn(
                  "ml-1 text-xs px-2 py-0.5 rounded-full",
                  change > 0 && "bg-success/20 text-success",
                  change < 0 && "bg-destructive/20 text-destructive",
                  change === 0 && "bg-muted text-muted-foreground"
                )}
              >
                {change > 0 ? `+${change}` : change}
              </span>
            </div>

            {/* Action Buttons */}
            {type === "incoming" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-success/10 hover:bg-success/20 text-success border-success/30"
                  onClick={onApprove}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30"
                  onClick={onReject}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-muted-foreground"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
};
