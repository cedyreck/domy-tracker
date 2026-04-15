import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GenerateTokenFormProps {
  onGenerate: (expiresAt?: Date) => Promise<string>;
}

export const GenerateTokenForm = ({ onGenerate }: GenerateTokenFormProps) => {
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const token = await onGenerate(hasExpiration ? expirationDate : undefined);
      setGeneratedToken(token);
      setTimeout(() => setGeneratedToken(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard>
      <GlassCardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Generate Invite Token</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="has-expiration" className="text-sm">
              Set expiration date
            </Label>
            <Switch
              id="has-expiration"
              checked={hasExpiration}
              onCheckedChange={setHasExpiration}
            />
          </div>

          {hasExpiration && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background/50",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate
                    ? format(expirationDate, "PPP")
                    : "Pick expiration date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-card" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isLoading || (hasExpiration && !expirationDate)}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generate Token
          </Button>

          {generatedToken && (
            <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
              <p className="text-sm text-success">Token generated!</p>
              <code className="font-mono text-sm">{generatedToken}</code>
            </div>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
};
