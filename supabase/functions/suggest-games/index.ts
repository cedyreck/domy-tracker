import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all players with their total scores
    const { data: players, error: playersError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url");

    if (playersError) {
      throw new Error(`Failed to fetch players: ${playersError.message}`);
    }

    // Fetch all relationships to calculate total scores
    const { data: relationships, error: relError } = await supabase
      .from("domy_relationships")
      .select("player_id, opponent_id, balance");

    if (relError) {
      throw new Error(`Failed to fetch relationships: ${relError.message}`);
    }

    // Calculate total score for each player
    const playerScores = players.map((player) => {
      const totalBalance = relationships
        .filter((r) => r.player_id === player.id)
        .reduce((sum, r) => sum + r.balance, 0);
      return {
        id: player.id,
        username: player.username,
        avatar_url: player.avatar_url,
        total_score: totalBalance,
      };
    });

    // Sort by score for ranking context
    const rankedPlayers = [...playerScores].sort((a, b) => b.total_score - a.total_score);

    // Build head-to-head matchup data
    const matchupData: Record<string, Record<string, number>> = {};
    relationships.forEach((r) => {
      const playerName = playerScores.find((p) => p.id === r.player_id)?.username;
      const opponentName = playerScores.find((p) => p.id === r.opponent_id)?.username;
      if (playerName && opponentName) {
        if (!matchupData[playerName]) matchupData[playerName] = {};
        matchupData[playerName][opponentName] = r.balance;
      }
    });

    // Build context for AI
    const playerContext = rankedPlayers
      .map((p, idx) => `${idx + 1}. ${p.username}: ${p.total_score} points`)
      .join("\n");

    // Build head-to-head context
    const h2hContext = Object.entries(matchupData)
      .map(([player, opponents]) => {
        const records = Object.entries(opponents)
          .filter(([_, balance]) => balance !== 0)
          .map(([opp, balance]) => `vs ${opp}: ${balance > 0 ? "+" : ""}${balance}`)
          .join(", ");
        return records ? `${player}: ${records}` : null;
      })
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are a game matchmaking AI for a Domy (Dominoes) tracking app. 
Your job is to suggest the best 3-player matchups for exciting games based on player scores AND their head-to-head records.

IMPORTANT: Analyze both overall rankings AND individual matchup history to create balanced, exciting games.

A good game matchup should:
1. Consider head-to-head records - close rivalries (small balance differences) make exciting matches
2. Balance skill levels - avoid putting all top players or all beginners together
3. Create revenge opportunities - if Player A dominates Player B, add Player C who beats Player A
4. Identify triangle rivalries - where A beats B, B beats C, C beats A
5. Mix experienced players with newcomers for mentorship matches
6. Create "upset potential" matches where underdogs could shine

Analyze BOTH the total scores AND the head-to-head records carefully.
Suggest 3-5 different game matchups with variety (competitive, mentorship, upset potential).

Format your response as JSON with this structure:
{
  "suggestions": [
    {
      "players": ["Player1", "Player2", "Player3"],
      "title": "The Rivalry Match",
      "description": "Brief explanation referencing specific head-to-head records and why this would be exciting",
      "excitement_level": "High" | "Medium" | "Epic"
    }
  ]
}`; 

    const userPrompt = `Here are the current player rankings:
${playerContext}

Here are the head-to-head records (positive = wins against, negative = losses to):
${h2hContext || "No head-to-head data yet"}

Suggest the best 3-player matchups for exciting, balanced games. Reference specific rivalries and records in your explanations.`;

    console.log("Calling Lovable AI for game suggestions...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI suggestions");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let suggestions;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      suggestions = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      suggestions = {
        suggestions: [
          {
            players: rankedPlayers.slice(0, 3).map((p) => p.username),
            title: "Top 3 Showdown",
            description: "A match between the current top 3 players",
            excitement_level: "High",
          },
        ],
      };
    }

    // Enrich suggestions with player data
    const enrichedSuggestions = suggestions.suggestions.map((s: any) => ({
      ...s,
      player_details: s.players.map((username: string) => {
        const player = playerScores.find((p) => p.username === username);
        return player || { username, total_score: 0 };
      }),
    }));

    return new Response(
      JSON.stringify({ suggestions: enrichedSuggestions, players: rankedPlayers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in suggest-games:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
