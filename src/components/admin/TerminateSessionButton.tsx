import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGameSessions } from "@/hooks/useGameSessions";
import { Loader2, StopCircle } from "lucide-react";
import { toast } from "sonner";

export const TerminateSessionButton = () => {
  const { terminateSession, canTerminate } = useGameSessions();
  const [open, setOpen] = useState(false);

  if (!canTerminate) return null;

  const handleTerminate = async () => {
    try {
      await terminateSession.mutateAsync();
      toast.success("Game session ended! All scores have been archived and reset.");
      setOpen(false);
    } catch (error: any) {
      console.error("Terminate session error:", error);
      toast.error(error?.message || "Failed to end game session");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <StopCircle className="h-4 w-4" />
          End Game Session
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End Current Game Session?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>This action will:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Archive all current player scores</li>
              <li>Reset all balances to 0</li>
              <li>Cancel all pending update requests</li>
              <li>Start a new game session</li>
            </ul>
            <p className="font-medium text-foreground mt-3">
              This action cannot be undone. The archived scores will be viewable in Reports.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleTerminate}
            disabled={terminateSession.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {terminateSession.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Ending...
              </>
            ) : (
              "End Session"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
