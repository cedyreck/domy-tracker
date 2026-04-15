import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpdateDomyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponentUsername: string;
  currentBalance: number;
  onConfirm: (newBalance: number) => Promise<void>;
}

export const UpdateDomyDialog = ({
  open,
  onOpenChange,
  opponentUsername,
  currentBalance,
  onConfirm,
}: UpdateDomyDialogProps) => {
  const [newBalance, setNewBalance] = useState(currentBalance);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (newBalance === currentBalance) {
      onOpenChange(false);
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(newBalance);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrement = () => setNewBalance((prev) => Math.min(prev + 1, 9999));
  const handleDecrement = () => setNewBalance((prev) => Math.max(prev - 1, -9999));

  const getBalanceColor = (bal: number) => {
    if (bal > 0) return "text-success";
    if (bal < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const formatBalance = (bal: number) => {
    if (bal > 0) return `+${bal}`;
    return bal.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Domy Balance</DialogTitle>
          <DialogDescription>
            Adjust your balance against <strong>{opponentUsername}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleDecrement}
            >
              <Minus className="h-5 w-5" />
            </Button>

            <div className="relative">
              <Input
                type="number"
                value={newBalance}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setNewBalance(Math.max(-9999, Math.min(9999, val)));
                }}
                className={cn(
                  "h-16 w-28 text-center text-3xl font-bold bg-background/50",
                  getBalanceColor(newBalance)
                )}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleIncrement}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Current: <span className={getBalanceColor(currentBalance)}>{formatBalance(currentBalance)}</span>
            {newBalance !== currentBalance && (
              <>
                {" → "}
                <span className={getBalanceColor(newBalance)}>{formatBalance(newBalance)}</span>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || newBalance === currentBalance}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
