import { useDomyRelationships } from "@/hooks/useDomyRelationships";
import { usePendingUpdates } from "@/hooks/usePendingUpdates";
import { DomyBalanceCard } from "@/components/dashboard/DomyBalanceCard";
import { BalanceChart } from "@/components/dashboard/BalanceChart";
import { PendingRequestCard } from "@/components/dashboard/PendingRequestCard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Loader2, Users, Bell, Send } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { relationships, allPlayers, isLoading } = useDomyRelationships();
  const {
    incomingRequests,
    outgoingRequests,
    createRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    hasPendingRequest,
  } = usePendingUpdates();

  // Calculate total score
  const totalScore = relationships.reduce((sum, rel) => sum + rel.balance, 0);
  const opponentCount = relationships.length + allPlayers.filter(p => !relationships.some(r => r.opponent_id === p.id)).length;
  const pendingCount = incomingRequests.length + outgoingRequests.length;

  const handleRequestUpdate = async (opponentId: string, newBalance: number, currentBalance: number) => {
    // Check if there's already a pending request for this opponent
    if (hasPendingRequest(opponentId)) {
      toast.error("You already have a pending request for this player");
      return;
    }
    
    try {
      await createRequest.mutateAsync({
        opponentId,
        proposedBalance: newBalance,
        currentBalance,
      });
      toast.success("Update request sent! Waiting for approval.");
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || "";
      if (errorMessage.includes("duplicate") || errorMessage.includes("unique constraint")) {
        toast.error("You already have a pending request for this player");
      } else {
        console.error("Create request error:", error);
        toast.error("Failed to send update request");
      }
    }
  };

  const handleApprove = async (pendingId: string) => {
    try {
      await approveRequest.mutateAsync(pendingId);
      toast.success("Update approved!");
    } catch (error: any) {
      console.error("Approve error:", error);
      toast.error(error?.message || "Failed to approve update");
    }
  };

  const handleReject = async (pendingId: string) => {
    try {
      await rejectRequest.mutateAsync(pendingId);
      toast.success("Update rejected");
    } catch (error: any) {
      console.error("Reject error:", error);
      toast.error(error?.message || "Failed to reject update");
    }
  };

  const handleCancel = async (pendingId: string) => {
    try {
      await cancelRequest.mutateAsync(pendingId);
      toast.success("Request cancelled");
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  // Merge existing relationships with players who don't have one yet
  const existingOpponentIds = new Set(relationships.map((r) => r.opponent_id));
  const playersWithoutRelationship = allPlayers.filter(
    (p) => !existingOpponentIds.has(p.id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your domy balance and send update requests</p>
      </div>

      {/* Stats Cards */}
      <StatsCards 
        totalScore={totalScore} 
        opponentCount={opponentCount} 
        pendingCount={pendingCount} 
      />

      {/* Pending Requests Section */}
      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <div className="space-y-4">
          {incomingRequests.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-warning">
                <Bell className="h-4 w-4" />
                <span>Pending Approvals ({incomingRequests.length})</span>
              </div>
              <div className="grid gap-2">
                {incomingRequests.map((request) => (
                  <PendingRequestCard
                    key={request.id}
                    request={request}
                    type="incoming"
                    onApprove={() => handleApprove(request.id)}
                    onReject={() => handleReject(request.id)}
                    isLoading={approveRequest.isPending || rejectRequest.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {outgoingRequests.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Send className="h-4 w-4" />
                <span>Sent Requests ({outgoingRequests.length})</span>
              </div>
              <div className="grid gap-2">
                {outgoingRequests.map((request) => (
                  <PendingRequestCard
                    key={request.id}
                    request={request}
                    type="outgoing"
                    onCancel={() => handleCancel(request.id)}
                    isLoading={cancelRequest.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Split View: Chart (Left) | Player List (Right) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Section: Chart */}
        <div className="order-2 lg:order-1">
          <BalanceChart />
        </div>

        {/* Right Section: Player List */}
        <div className="order-1 lg:order-2 space-y-4">
          <GlassCard>
            <GlassCardHeader className="pb-2">
              <GlassCardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Player Balances
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {relationships.length === 0 && playersWithoutRelationship.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No players yet. Invite others to start tracking!</p>
                </div>
              ) : (
                <>
                  {relationships.map((rel) => (
                    <DomyBalanceCard
                      key={rel.id}
                      opponentId={rel.opponent_id}
                      opponentUsername={rel.opponent?.username || "Unknown"}
                      opponentAvatar={rel.opponent?.avatar_url}
                      balance={rel.balance}
                      onUpdate={handleRequestUpdate}
                      hasPendingRequest={hasPendingRequest(rel.opponent_id)}
                    />
                  ))}
                  {playersWithoutRelationship.map((player) => (
                    <DomyBalanceCard
                      key={player.id}
                      opponentId={player.id}
                      opponentUsername={player.username}
                      opponentAvatar={player.avatar_url}
                      balance={0}
                      onUpdate={handleRequestUpdate}
                      hasPendingRequest={hasPendingRequest(player.id)}
                    />
                  ))}
                </>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
