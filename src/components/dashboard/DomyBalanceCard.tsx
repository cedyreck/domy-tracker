import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { Pencil } from "lucide-react";
import { UpdateDomyDialog } from "./UpdateDomyDialog";

interface DomyBalanceCardProps {
  opponentId: string;
  opponentUsername: string;
  opponentAvatar?: string | null;
  balance: number;
  onUpdate: (opponentId: string, newBalance: number) => Promise<void>;
}

export const DomyBalanceCard = ({
  opponentId,
  opponentUsername,
  opponentAvatar,
  balance,
  onUpdate,
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
        className="group relative overflow-hidden"
      >
        <GlassCardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarImage src={opponentAvatar || ""} alt={opponentUsername} />
              <AvatarFallback className="bg-muted text-lg">
                {opponentUsername.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{opponentUsername}</p>
              <p className="text-sm text-muted-foreground">vs you</p>
            </div>
          </div>

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
              className="opacity-0 group-hover:opacity-100 transition-opacity"
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
          await onUpdate(opponentId, newBalance);
          setIsDialogOpen(false);
        }}
      />
    </>
  );
};
