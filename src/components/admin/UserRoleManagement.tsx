import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
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

interface UserWithRole {
  id: string;
  username: string;
  avatar_url: string | null;
  role: "admin" | "user";
}

export const UserRoleManagement = () => {
  const queryClient = useQueryClient();
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .order("username");

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          role: (userRole?.role as "admin" | "user") || "user",
        };
      });

      return usersWithRoles;
    },
  });

  const promoteToAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("User promoted to admin");
      setPromotingUserId(null);
    },
    onError: (error) => {
      toast.error("Failed to promote user: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const regularUsers = users.filter((u) => u.role === "user");
  const adminUsers = users.filter((u) => u.role === "admin");

  return (
    <div className="space-y-4">
      {/* Current Admins */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Current Admins</h4>
        <div className="space-y-2">
          {adminUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback className="bg-muted text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.username}</span>
              </div>
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Regular Users */}
      {regularUsers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Promote User to Admin
          </h4>
          <div className="space-y-2">
            {regularUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="bg-muted text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.username}</span>
                  <Badge variant="secondary" className="gap-1">
                    <User className="h-3 w-3" />
                    User
                  </Badge>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPromotingUserId(user.id)}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Promote
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to promote <strong>{user.username}</strong> to
                        admin? They will have full access to manage game sessions, tokens,
                        and other users.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => promoteToAdmin.mutate(user.id)}
                        disabled={promoteToAdmin.isPending}
                      >
                        {promoteToAdmin.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Promote to Admin
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}

      {regularUsers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          All users are already admins.
        </p>
      )}
    </div>
  );
};
