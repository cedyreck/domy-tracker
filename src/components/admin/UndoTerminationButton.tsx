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
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const UndoTerminationButton = () => {
  const { undoLastTermination, canTerminate } = useGameSessions();
  const [open, setOpen] = useState(false);

  if (!canTerminate) return null;

  const handleUndo = async () => {
    try {
      await undoLastTermination.mutateAsync();
      toast.success("Last session termination was successfully undone.");
      setOpen(false);
    } catch (error: any) {
      console.error("Undo termination error:", error);
      toast.error(error?.message || "Failed to undo last termination");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Undo Last Termination
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Undo last session termination?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>This action is only available within 72 hours of session end.</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Restores balances from the termination snapshot</li>
              <li>Reopens the last ended session</li>
              <li>Removes archived scores for that termination</li>
            </ul>
            <p className="font-medium text-foreground mt-3">
              Undo will fail if new balance activity already exists in the current session.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUndo}
            disabled={undoLastTermination.isPending}
          >
            {undoLastTermination.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Undoing...
              </>
            ) : (
              "Undo"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
