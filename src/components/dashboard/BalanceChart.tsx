import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { TrendingUp } from "lucide-react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const BalanceChart = () => {
  const { user } = useAuth();
  const { logs } = useActivityLogs(100);

  // Filter logs for current user and calculate cumulative balance over time
  const chartData = useMemo(() => {
    if (!user?.id || !logs.length) return [];

    // Get logs where current user is the player
    const userLogs = logs
      .filter((log) => log.player_id === user.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (userLogs.length === 0) return [];

    // Create data points showing balance progression
    const dataPoints = userLogs.map((log, index) => ({
      date: format(new Date(log.created_at), "MMM d"),
      balance: log.new_value,
      opponent: log.opponent?.username || "Unknown",
      index,
    }));

    return dataPoints;
  }, [logs, user?.id]);

  const totalBalance = chartData.length > 0 
    ? chartData.reduce((sum, point) => sum + point.balance, 0) / chartData.length 
    : 0;

  return (
    <GlassCard className="h-full">
      <GlassCardHeader className="pb-2">
        <GlassCardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Balance Progress
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No activity data yet
          </div>
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string, props: any) => [
                    <span key="value" style={{ color: value >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
                      {value >= 0 ? `+${value}` : value}
                    </span>,
                    `vs ${props.payload.opponent}`,
                  ]}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
};
