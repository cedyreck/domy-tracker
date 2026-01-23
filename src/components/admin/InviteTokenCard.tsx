import { cn } from "@/lib/utils";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Check } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface InviteTokenCardProps {
  token: string;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  onRevoke: () => void;
}

export const InviteTokenCard = ({
  token,
  usedBy,
  usedAt,
  expiresAt,
  createdAt,
  onRevoke,
}: InviteTokenCardProps) => {
  const [copied, setCopied] = useState(false);

  const isUsed = !!usedBy;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  const getStatus = () => {
    if (isUsed) return { label: "Used", variant: "secondary" as const };
    if (isExpired) return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "default" as const };
  };

  const status = getStatus();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className={cn(isUsed && "opacity-60")}>
      <GlassCardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
              {token}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              disabled={isUsed || isExpired}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Created {format(new Date(createdAt), "MMM d, yyyy 'at' h:mm a")}
            {expiresAt && !isUsed && (
              <> · Expires {format(new Date(expiresAt), "MMM d, yyyy")}</>
            )}
            {usedAt && (
              <> · Used {format(new Date(usedAt), "MMM d, yyyy")}</>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {!isUsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onRevoke}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
};
