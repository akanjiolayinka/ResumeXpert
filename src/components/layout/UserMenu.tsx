import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, Settings as SettingsIcon, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/lib/queries/profile";
import { supabase } from "@/lib/supabase";

function firstInitial(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const ch = name.trim().charAt(0);
    if (ch) return ch.toUpperCase();
  }
  if (email) return email.charAt(0).toUpperCase();
  return "?";
}

/**
 * Avatar-triggered dropdown shown when the user is signed in. Renders the
 * user's name + email, a static "Free plan" pill, and Dashboard / Settings /
 * Sign out actions. While useProfile is loading, the trigger shows a small
 * spinner placeholder rather than flashing a fallback initial.
 */
export function UserMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Account";
  const email = user?.email ?? "";
  const initial = firstInitial(profile?.full_name, email);

  const onSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Account menu"
      >
        {isLoading ? (
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Avatar className="h-9 w-9">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={displayName} /> : null}
            <AvatarFallback className="text-sm">{initial}</AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">
              {isLoading ? <Skeleton className="h-4 w-24" /> : displayName}
            </p>
            <Badge variant="secondary" className="text-[10px] shrink-0">Free plan</Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
          <SettingsIcon className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            void onSignOut();
          }}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
