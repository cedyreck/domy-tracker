import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import {
  signInSchema,
  signUpSchema,
  SignInInput,
  SignUpInput,
} from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Gamepad2, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

const Auth = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Check if user is coming from password reset link (has access_token in hash or type=recovery)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    
    if (type === "recovery") {
      setShowResetPassword(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check if this is the first user
    const checkFirstUser = async () => {
      const { data, error } = await supabase.rpc("is_first_user");
      if (!error) {
        setIsFirstUser(data);
      }
    };
    checkFirstUser();
  }, []);

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      inviteToken: "",
    },
  });

  const handleSignIn = async (data: SignInInput) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const handleSignUp = async (data: SignUpInput) => {
    setIsLoading(true);
    const { error } = await signUp(
      data.email,
      data.password,
      data.username,
      data.inviteToken || undefined
    );
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        isFirstUser
          ? "Welcome, Admin! Your account has been created."
          : "Account created successfully!"
      );
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      <GlassCard className="w-full max-w-md animate-fade-in">
        <GlassCardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
            <Gamepad2 className="h-8 w-8 text-primary" />
          </div>
          <GlassCardTitle className="gradient-text text-3xl">
            Domy Tracker
          </GlassCardTitle>
          <GlassCardDescription>
            Track your competitive domy balance
          </GlassCardDescription>
        </GlassCardHeader>

        <GlassCardContent>
          {showResetPassword ? (
            <ResetPasswordForm 
              onSuccess={() => {
                setShowResetPassword(false);
                // Clear the hash from URL
                window.history.replaceState(null, '', window.location.pathname);
              }} 
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                {showForgotPassword ? (
                  <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
                ) : (
                  <form
                    onSubmit={signInForm.handleSubmit(handleSignIn)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        {...signInForm.register("email")}
                      />
                      {signInForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {signInForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        {...signInForm.register("password")}
                      />
                      {signInForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {signInForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Sign In
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form
                  onSubmit={signUpForm.handleSubmit(handleSignUp)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="johndoe"
                      {...signUpForm.register("username")}
                    />
                    {signUpForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      {...signUpForm.register("email")}
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      {...signUpForm.register("password")}
                    />
                    {signUpForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {isFirstUser === false && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-token">Invite Token</Label>
                      <Input
                        id="signup-token"
                        type="text"
                        placeholder="Enter your invite token"
                        {...signUpForm.register("inviteToken")}
                      />
                      {signUpForm.formState.errors.inviteToken && (
                        <p className="text-sm text-destructive">
                          {signUpForm.formState.errors.inviteToken.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        An invite token is required to create an account
                      </p>
                    </div>
                  )}

                  {isFirstUser === true && (
                    <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                      <p className="text-sm text-primary">
                        🎉 You'll be the first user and will become an Admin!
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};

export default Auth;
