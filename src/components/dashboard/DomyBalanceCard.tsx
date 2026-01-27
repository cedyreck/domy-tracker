import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { Pencil, Clock } from "lucide-react";
import { UpdateDomyDialog } from "./UpdateDomyDialog";
import { RequestHistoryHoverCard } from "./RequestHistoryHoverCard";

interface DomyBalanceCardProps {
  opponentId: string;
  opponentUsername: string;
  opponentAvatar?: string | null;
  balance: number;
  onUpdate: (opponentId: string, newBalance: number, currentBalance: number) => Promise<void>;
  hasPendingRequest?: boolean;
}

export const DomyBalanceCard = ({
  opponentId,
  opponentUsername,
  opponentAvatar,
  balance,
  onUpdate,
  hasPendingRequest = false,
}: DomyBalanceCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getBalanceColor = (bal: number) => {
    if (bal > 0) return "text-success";
    if (bal < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getBalanceGlow = (bal: number) => {
    if (bal > 0) return "glow-success";
    if (bal < 0) return "glow-destructive";
    return "";
  };

  const formatBalance = (bal: number) => {
    if (bal > 0) return `+${bal}`;
    return bal.toString();
  };

  return (
    <>
      <GlassCard
        variant="elevated"
        className={cn(
          "group relative",
          hasPendingRequest && "border-warning/30"
        )}
      >
        <GlassCardContent className="flex items-center justify-between p-4">
          <RequestHistoryHoverCard
            opponentId={opponentId}
            opponentUsername={opponentUsername}
            opponentAvatar={opponentAvatar}
          >
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-border">
                  <AvatarImage src={opponentAvatar || ""} alt={opponentUsername} />
                  <AvatarFallback className="bg-muted text-lg">
                    {opponentUsername.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {hasPendingRequest && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-warning flex items-center justify-center">
                    <Clock className="h-3 w-3 text-warning-foreground" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{opponentUsername}</p>
                <p className="text-sm text-muted-foreground">
                  {hasPendingRequest ? (
                    <span className="text-warning">Pending approval</span>
                  ) : (
                    "vs you"
                  )}
                </p>
              </div>
            </div>
          </RequestHistoryHoverCard>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-14 w-20 items-center justify-center rounded-lg text-2xl font-bold transition-all",
                getBalanceColor(balance),
                balance !== 0 && getBalanceGlow(balance)
              )}
            >
              {formatBalance(balance)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDialogOpen(true)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                hasPendingRequest && "opacity-50 cursor-not-allowed"
              )}
              disabled={hasPendingRequest}
              title={hasPendingRequest ? "You have a pending request" : "Update balance"}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      <UpdateDomyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        opponentUsername={opponentUsername}
        currentBalance={balance}
        onConfirm={async (newBalance) => {
          await onUpdate(opponentId, newBalance, balance);
          setIsDialogOpen(false);
        }}
      />
    </>
  );
};
