import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    inviteToken?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
    return data?.role as UserRole;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Defer role fetching with setTimeout to avoid deadlock
      if (session?.user) {
        setTimeout(() => {
          fetchUserRole(session.user.id).then(setRole);
        }, 0);
      } else {
        setRole(null);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id).then((role) => {
          setRole(role);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    inviteToken?: string
  ): Promise<{ error: Error | null }> => {
    try {
      // Check if this is the first user
      const { data: isFirst, error: firstUserError } = await supabase.rpc(
        "is_first_user"
      );

      if (firstUserError) {
        return { error: new Error("Failed to check registration status") };
      }

      // If not first user, validate invite token
      if (!isFirst) {
        if (!inviteToken) {
          return { error: new Error("Invite token is required") };
        }

        const { data: isValid, error: tokenError } = await supabase.rpc(
          "validate_invite_token",
          { token_value: inviteToken }
        );

        if (tokenError || !isValid) {
          return { error: new Error("Invalid or expired invite token") };
        }
      }

      // Sign up the user
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        }
      );

      if (signUpError) {
        return { error: new Error(signUpError.message) };
      }

      if (!authData.user) {
        return { error: new Error("Failed to create user") };
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        username,
      });

      if (profileError) {
        // If username is taken
        if (profileError.code === "23505") {
          return { error: new Error("Username is already taken") };
        }
        return { error: new Error("Failed to create profile") };
      }

      // Assign role (admin for first user, user for others)
      const userRole = isFirst ? "admin" : "user";
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: userRole,
      });

      if (roleError) {
        return { error: new Error("Failed to assign role") };
      }

      // Mark invite token as used (if provided)
      if (inviteToken && !isFirst) {
        await supabase.rpc("use_invite_token", {
          token_value: inviteToken,
          user_id_value: authData.user.id,
        });
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        isAdmin: role === "admin",
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
