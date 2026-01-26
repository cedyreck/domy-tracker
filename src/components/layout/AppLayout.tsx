import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Gamepad2,
  LayoutDashboard,
  Trophy,
  Activity,
  FileText,
  Shield,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/rankings", icon: Trophy, label: "Rankings" },
  { to: "/activity", icon: Activity, label: "Activity" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

export const AppLayout = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const userInitial =
    user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-x-0 border-t-0 rounded-none">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <span className="gradient-text text-xl font-bold hidden sm:inline">
              Domy Tracker
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <Shield className="h-4 w-4" />
                Admin
              </NavLink>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden sm:flex"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card w-48">
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme} className="sm:hidden">
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Light mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border/50 p-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </NavLink>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
