import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Sparkles, RefreshCw, Trophy, Zap, Star, Users } from "lucide-react";
import { toast } from "sonner";

interface PlayerDetail {
  id?: string;
  username: string;
  avatar_url?: string | null;
  total_score: number;
}

interface GameSuggestion {
  players: string[];
  player_details: PlayerDetail[];
  title: string;
  description: string;
  excitement_level: "High" | "Medium" | "Epic";
}

interface SuggestionsResponse {
  suggestions: GameSuggestion[];
  players: PlayerDetail[];
}

const GameSuggestions = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<SuggestionsResponse>({
    queryKey: ["game-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("suggest-games");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Suggestions refreshed!");
    } catch {
      toast.error("Failed to refresh suggestions");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getExcitementIcon = (level: string) => {
    switch (level) {
      case "Epic":
        return <Star className="h-4 w-4 text-warning fill-warning" />;
      case "High":
        return <Zap className="h-4 w-4 text-destructive" />;
      default:
        return <Trophy className="h-4 w-4 text-primary" />;
    }
  };

  const getExcitementColor = (level: string) => {
    switch (level) {
      case "Epic":
        return "bg-gradient-to-r from-warning/20 to-destructive/20 border-warning/50";
      case "High":
        return "bg-gradient-to-r from-destructive/20 to-primary/20 border-destructive/50";
      default:
        return "bg-primary/10 border-primary/30";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">AI is analyzing player matchups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-destructive text-center">
          <p className="font-medium">Failed to load suggestions</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            Game Suggestions
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered matchups for the most exciting games
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Suggestions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.suggestions.map((suggestion, index) => (
          <GlassCard
            key={index}
            className={`overflow-hidden transition-all hover:scale-[1.02] ${getExcitementColor(suggestion.excitement_level)}`}
          >
            <GlassCardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  {getExcitementIcon(suggestion.excitement_level)}
                  {suggestion.title}
                </GlassCardTitle>
                <Badge
                  variant="secondary"
                  className={suggestion.excitement_level === "Epic" ? "bg-warning/20 text-warning" : ""}
                >
                  {suggestion.excitement_level}
                </Badge>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {/* Players */}
              <div className="flex items-center justify-center gap-2">
                {suggestion.player_details.map((player, pIndex) => (
                  <div key={pIndex} className="flex flex-col items-center gap-1">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                      <AvatarImage src={player.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {player.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate max-w-[60px]">
                      {player.username}
                    </span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {player.total_score > 0 ? "+" : ""}
                      {player.total_score}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground text-center">
                {suggestion.description}
              </p>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      {/* Player Rankings Reference */}
      {data?.players && data.players.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Current Rankings
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-wrap gap-2">
              {data.players.slice(0, 10).map((player, index) => (
                <div
                  key={player.id || index}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50"
                >
                  <span className="text-xs text-muted-foreground font-medium">
                    #{index + 1}
                  </span>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={player.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/20">
                      {player.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{player.username}</span>
                  <Badge variant="outline" className="text-xs">
                    {player.total_score > 0 ? "+" : ""}
                    {player.total_score}
                  </Badge>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
};

export default GameSuggestions;
