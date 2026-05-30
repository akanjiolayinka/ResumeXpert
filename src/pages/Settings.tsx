import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  User,
  Sliders,
  Palette,
  Shield,
  Database as DatabaseIcon,
  HelpCircle,
  Lock,
  Monitor,
  Sun,
  Moon,
  AlertTriangle,
  Upload,
  Loader2,
  Check,
  Download,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

// ── Section nav ─────────────────────────────────────────────────────────────
// Notifications + Billing intentionally omitted (Fi9 brief: hide entirely).
const navItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "data", label: "Data & Privacy", icon: DatabaseIcon },
  { id: "help", label: "Help & Feedback", icon: HelpCircle },
] as const;

type SectionId = (typeof navItems)[number]["id"];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("profile");

  return (
    <Layout>
      <div className="page-container py-8 md:py-12">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account and preferences.</p>

        <div className="flex flex-col md:flex-row gap-8">
          <nav className="md:w-56 shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                    activeSection === item.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1 min-w-0 max-w-2xl">
            {activeSection === "profile" && <ProfileSection />}
            {activeSection === "preferences" && <PreferencesSection />}
            {activeSection === "appearance" && <AppearanceSection />}
            {activeSection === "security" && <SecuritySection />}
            {activeSection === "data" && <DataSection />}
            {activeSection === "help" && <HelpSection />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ── Section card ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 space-y-4 mb-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Separator />
      {children}
    </section>
  );
}

function SavedBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Badge
      variant="outline"
      className="gap-1 text-green-700 dark:text-green-400 border-green-500/30"
    >
      <Check className="h-3 w-3" />
      Saved
    </Badge>
  );
}

// ── Profile ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  linkedin: z.string().trim().max(200).optional(),
  portfolio: z.string().trim().max(200).optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

function ProfileSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", location: "", linkedin: "", portfolio: "" },
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, location, linkedin_url, portfolio_url, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({
          title: "Couldn't load profile",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      reset({
        fullName: data?.full_name ?? "",
        location: data?.location ?? "",
        linkedin: data?.linkedin_url ?? "",
        portfolio: data?.portfolio_url ?? "",
      });
      setAvatarUrl(data?.avatar_url ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reset, toast]);

  const onSubmit = async (values: ProfileValues) => {
    if (!user) return;
    setSaving(true);
    setJustSaved(false);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName || null,
        location: values.location || null,
        linkedin_url: values.linkedin || null,
        portfolio_url: values.portfolio || null,
      } as never)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Image only", description: "Pick a PNG or JPG.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 5 MB.", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const path = `${user.id}/avatar.png`;
    const { error: upErr } = await supabase.storage
      .from("resume-uploads")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    // Create a short-lived signed URL so we can render the avatar from a
    // private bucket without making the file public.
    const { data: signed, error: signErr } = await supabase.storage
      .from("resume-uploads")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    const newUrl = signed?.signedUrl ?? path;
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: newUrl } as never)
      .eq("id", user.id);
    setUploadingAvatar(false);
    if (signErr || dbErr) {
      toast({
        title: "Saved partially",
        description: (signErr ?? dbErr)?.message ?? "Could not finalize avatar.",
        variant: "destructive",
      });
      return;
    }
    setAvatarUrl(newUrl);
    toast({ title: "Avatar updated" });
  };

  if (loading) {
    return (
      <SectionCard title="Profile">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Profile" description="How you appear inside the app.">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
          <AvatarFallback className="text-base">
            {(user?.email ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={handleAvatarPick} disabled={uploadingAvatar} className="gap-2">
            {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploadingAvatar ? "Uploading…" : "Upload avatar"}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">PNG or JPG, up to 5 MB.</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email ?? ""} disabled className="mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1">Managed by your sign-in. Change it from your auth provider.</p>
        </div>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" className="mt-1.5" {...register("fullName")} />
          {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="e.g. Lagos, Nigeria" className="mt-1.5" {...register("location")} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" placeholder="linkedin.com/in/…" className="mt-1.5" {...register("linkedin")} />
          </div>
          <div>
            <Label htmlFor="portfolio">Portfolio</Label>
            <Input id="portfolio" placeholder="yourname.dev" className="mt-1.5" {...register("portfolio")} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save changes"}
          </Button>
          <SavedBadge visible={justSaved} />
        </div>
      </form>
    </SectionCard>
  );
}

// ── Preferences ─────────────────────────────────────────────────────────────

const prefsSchema = z.object({
  defaultCoverTone: z.enum(["warm", "direct", "enthusiastic"]),
  defaultResumeLength: z.union([z.literal(1), z.literal(2)]),
  reduceMotion: z.boolean(),
});
type PrefsValues = z.infer<typeof prefsSchema>;

function PreferencesSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const { handleSubmit, reset, watch, setValue } = useForm<PrefsValues>({
    resolver: zodResolver(prefsSchema),
    defaultValues: { defaultCoverTone: "warm", defaultResumeLength: 1, reduceMotion: false },
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("default_cover_tone, default_resume_length, reduce_motion")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const tone = (data?.default_cover_tone ?? "warm") as PrefsValues["defaultCoverTone"];
      const length = (data?.default_resume_length === 2 ? 2 : 1) as PrefsValues["defaultResumeLength"];
      reset({
        defaultCoverTone: tone,
        defaultResumeLength: length,
        reduceMotion: data?.reduce_motion ?? false,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reset]);

  const values = watch();

  const onSubmit = async (v: PrefsValues) => {
    if (!user) return;
    setSaving(true);
    setJustSaved(false);
    const { error } = await supabase
      .from("profiles")
      .update({
        default_cover_tone: v.defaultCoverTone,
        default_resume_length: v.defaultResumeLength,
        reduce_motion: v.reduceMotion,
      } as never)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  if (loading) {
    return (
      <SectionCard title="Preferences">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Preferences" description="Defaults applied to new tailoring and cover letters.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label className="mb-1.5 block">Default cover letter tone</Label>
          <Select value={values.defaultCoverTone} onValueChange={(v) => setValue("defaultCoverTone", v as PrefsValues["defaultCoverTone"], { shouldDirty: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="warm">Warm — friendly and personable</SelectItem>
              <SelectItem value="direct">Direct — concise and to-the-point</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic — energetic and passionate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1.5 block">Default resume length</Label>
          <Select value={String(values.defaultResumeLength)} onValueChange={(v) => setValue("defaultResumeLength", (Number(v) === 2 ? 2 : 1) as PrefsValues["defaultResumeLength"], { shouldDirty: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 page</SelectItem>
              <SelectItem value="2">2 pages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="reduceMotionPref" className="cursor-pointer">Reduce motion</Label>
          <Switch
            id="reduceMotionPref"
            checked={values.reduceMotion}
            onCheckedChange={(v) => setValue("reduceMotion", v, { shouldDirty: true })}
          />
        </div>

        {/* Trust-signal switch — locked on. Not a user preference. */}
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">AI never invents experience</Label>
          </div>
          <Switch checked disabled />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save changes"}
          </Button>
          <SavedBadge visible={justSaved} />
        </div>
      </form>
    </SectionCard>
  );
}

// ── Appearance ──────────────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("reduce_motion")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setReduceMotion(data?.reduce_motion ?? false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onMotionChange = async (v: boolean) => {
    if (!user) return;
    setReduceMotion(v);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ reduce_motion: v } as never)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      setReduceMotion(!v);
    }
  };

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <SectionCard title="Appearance">
      <div>
        <Label className="mb-2 block">Theme</Label>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors",
                theme === t.id ? "bg-accent border-primary" : "hover:bg-muted",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="reduceMotionAppearance" className="cursor-pointer">
          Reduce motion
          {saving && <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />}
        </Label>
        <Switch id="reduceMotionAppearance" checked={reduceMotion} onCheckedChange={onMotionChange} />
      </div>
    </SectionCard>
  );
}

// ── Security ────────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

function SecuritySection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (v: PasswordValues) => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: v.newPassword });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast({ title: "Password updated" });
  };

  const onSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/");
  };

  return (
    <>
      <SectionCard title="Update password">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" className="mt-1.5" autoComplete="current-password" {...register("currentPassword")} />
            <p className="text-xs text-muted-foreground mt-1">Not required by Supabase, but good practice.</p>
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" className="mt-1.5" autoComplete="new-password" {...register("newPassword")} />
            {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" className="mt-1.5" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</> : "Update password"}
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Sign out" description="Ends your session on this device.">
        <Button variant="outline" onClick={onSignOut} disabled={signingOut} className="gap-2">
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sign out of this device
        </Button>
      </SectionCard>

      <SectionCard title="Two-factor authentication">
        <div className="flex items-start gap-3 rounded-md bg-muted/30 p-3">
          <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            Coming soon. Today, signing in requires email + password.
          </div>
        </div>
      </SectionCard>
    </>
  );
}

// ── Data & Privacy ──────────────────────────────────────────────────────────

function DataSection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("You are not signed in.");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/export-user-data`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resumexpert-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error || (data && (data as { error?: string }).error)) {
        throw new Error(error?.message ?? (data as { error?: string }).error ?? "Delete failed");
      }
      await supabase.auth.signOut();
      toast({ title: "Account deleted" });
      navigate("/");
    } catch (err) {
      setDeleting(false);
      toast({
        title: "Couldn't delete account",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SectionCard title="Export your data" description="Download a JSON file containing every row we hold for you.">
        <Button onClick={onExport} disabled={exporting} className="gap-2">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Preparing…" : "Export all data"}
        </Button>
      </SectionCard>

      <SectionCard title="Delete account" description="Permanently delete your account and all data. This can't be undone.">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <span>
            Deletes your resumes, tailoring jobs, scores, cover letters, chat history, and login. Your data
            cannot be recovered.
          </span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete my account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                Type <strong>DELETE</strong> to confirm. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteConfirm !== "DELETE" || deleting}
                onClick={(e) => {
                  e.preventDefault();
                  void onDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting…</> : "Delete forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SectionCard>
    </>
  );
}

// ── Help & Feedback ─────────────────────────────────────────────────────────

const messageSchema = z.object({
  kind: z.enum(["support", "feature_request"]),
  message: z.string().trim().min(10, "At least 10 characters").max(5000),
});
type MessageValues = z.infer<typeof messageSchema>;

function HelpSection() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { kind: "support", message: "" },
  });

  const kind = watch("kind");

  const onSubmit = async (v: MessageValues) => {
    setSubmitting(true);
    setSent(false);
    const { error } = await supabase.functions.invoke("support-message", {
      body: { kind: v.kind, message: v.message },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send message", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
    reset({ kind: v.kind, message: "" });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <SectionCard title="Send us a message" description="Get help or suggest something — we read every message.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label className="mb-1.5 block">Type</Label>
          <Select value={kind} onValueChange={(v) => setValue("kind", v as MessageValues["kind"], { shouldDirty: true })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="support">Support — I need help with something</SelectItem>
              <SelectItem value="feature_request">Feature request — I'd like to see</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="supportMessage">Message</Label>
          <Textarea
            id="supportMessage"
            rows={5}
            placeholder="What's going on? The more detail you can share, the better."
            className="mt-1.5"
            {...register("message")}
          />
          {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : "Send message"}
          </Button>
          {sent && (
            <Badge variant="outline" className="gap-1 text-green-700 dark:text-green-400 border-green-500/30">
              <Check className="h-3 w-3" />
              Message sent
            </Badge>
          )}
        </div>
      </form>
    </SectionCard>
  );
}
