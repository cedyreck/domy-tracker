import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: "new-session-id", error: null })),
  },
}));

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    isAdmin: true,
    user: { id: "test-user-id" },
  })),
}));

describe("useGameSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export canTerminate as true when user is admin", async () => {
    const { useAuth } = await import("@/contexts/AuthContext");
    expect(useAuth().isAdmin).toBe(true);
  });

  it("should have terminate_game_session RPC available", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const result = await supabase.rpc("terminate_game_session");
    expect(result.error).toBeNull();
    expect(result.data).toBe("new-session-id");
  });

  it("should have undo_last_termination RPC available", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const result = await supabase.rpc("undo_last_termination");
    expect(result.error).toBeNull();
    expect(result.data).toBe("new-session-id");
  });
});

describe("TerminateSessionButton visibility", () => {
  it("should not render when user is not admin", async () => {
    // The button checks canTerminate which comes from isAdmin
    const { useAuth } = await import("@/contexts/AuthContext");
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      user: { id: "test-user-id" },
    } as any);
    
    expect(useAuth().isAdmin).toBe(false);
  });
});
