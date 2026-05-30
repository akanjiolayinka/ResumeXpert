import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import {
  Menu,
  FileText,
  Target,
  BarChart3,
  Mail,
  MessageSquare,
  Lightbulb,
  Settings,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/lib/queries/profile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { to: "/resume-builder", label: "Builder", icon: FileText },
  { to: "/resume-tailor", label: "Tailor", icon: Target },
  { to: "/ats-scan", label: "ATS Scan", icon: BarChart3 },
  { to: "/cover-letter", label: "Cover Letter", icon: Mail },
  { to: "/chatbot", label: "Chatbot", icon: MessageSquare },
  { to: "/tips", label: "Tips", icon: Lightbulb },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;
  const isAuthed = !!user;

  const handleMobileSignOut = async () => {
    setIsOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/");
  };

  const initial = (profile?.full_name?.trim().charAt(0) || user?.email?.charAt(0) || "?").toUpperCase();
  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Account";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <nav className="page-container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">ResumeXpert</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(link.to)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          {isAuthed ? (
            <UserMenu />
          ) : (
            <Link to="/auth/login">
              <Button>Get Started</Button>
            </Link>
          )}
        </div>

        {/* Mobile Right */}
        <div className="flex lg:hidden items-center gap-1">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 pt-6 h-full">
                <Link
                  to="/"
                  className="flex items-center gap-2 font-semibold text-xl"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span>ResumeXpert</span>
                </Link>

                {isAuthed && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
                    <Avatar className="h-9 w-9">
                      {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={displayName} /> : null}
                      <AvatarFallback className="text-sm">{initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <Badge variant="secondary" className="text-[10px]">Free plan</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive(link.to)
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                  {isAuthed && (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive("/dashboard")
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive("/settings")
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>

                <div className="mt-auto pt-4 border-t">
                  {isAuthed ? (
                    <Button variant="outline" className="w-full gap-2" onClick={handleMobileSignOut}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  ) : (
                    <Link to="/auth/login" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
