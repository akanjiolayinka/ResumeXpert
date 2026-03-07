import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/storage";
import {
  User, Sliders, Palette, Bell, Shield, CreditCard,
  Database, HelpCircle, Lock, Info, Monitor, Sun, Moon,
  AlertTriangle, ExternalLink, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "data", label: "Data & Privacy", icon: Database },
  { id: "help", label: "Help & Feedback", icon: HelpCircle },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const { toast } = useToast();

  const handleSave = (section: string) => {
    toast({ title: "Saved", description: `${section} settings updated.` });
  };

  return (
    <Layout>
      <div className="page-container py-8 md:py-12">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account and preferences.</p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left nav */}
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
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Right content */}
          <div className="flex-1 min-w-0 max-w-2xl">
            {activeSection === "profile" && <ProfileSection onSave={() => handleSave("Profile")} />}
            {activeSection === "preferences" && <PreferencesSection onSave={() => handleSave("Preferences")} />}
            {activeSection === "appearance" && <AppearanceSection onSave={() => handleSave("Appearance")} />}
            {activeSection === "notifications" && <NotificationsSection onSave={() => handleSave("Notifications")} />}
            {activeSection === "security" && <SecuritySection />}
            {activeSection === "billing" && <BillingSection />}
            {activeSection === "data" && <DataSection />}
            {activeSection === "help" && <HelpSection />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mb-5">{description}</p>}
      {!description && <div className="mb-5" />}
      {children}
    </div>
  );
}

function SaveBar({ onSave, onReset }: { onSave: () => void; onReset?: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-5 border-t mt-6">
      <Button onClick={onSave}>Save changes</Button>
      {onReset && <Button variant="outline" onClick={onReset}>Reset</Button>}
    </div>
  );
}

function ProfileSection({ onSave }: { onSave: () => void }) {
  const [profile, setProfile] = useState(() =>
    loadFromLocalStorage("settings_profile", {
      fullName: "", email: "user@example.com", location: "",
      linkedin: "", portfolio: "",
    })
  );

  const save = () => {
    saveToLocalStorage("settings_profile", profile);
    onSave();
  };

  return (
    <SectionCard title="Profile" description="Your personal information.">
      <div className="space-y-4">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <User className="h-6 w-6" />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-3.5 w-3.5" /> Upload photo
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled className="mt-1.5 opacity-60" />
            <p className="text-xs text-muted-foreground mt-1">Contact support to change email.</p>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="Lagos, Nigeria" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" placeholder="linkedin.com/in/..." value={profile.linkedin} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="portfolio">Portfolio / GitHub</Label>
            <Input id="portfolio" placeholder="github.com/..." value={profile.portfolio} onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })} className="mt-1.5" />
          </div>
        </div>
      </div>
      <SaveBar onSave={save} />
    </SectionCard>
  );
}

function PreferencesSection({ onSave }: { onSave: () => void }) {
  const [prefs, setPrefs] = useState(() =>
    loadFromLocalStorage("settings_prefs", {
      resumeLength: "1", resumeTone: "neutral", coverTone: "warm",
      autoSave: true, noInvent: true,
    })
  );

  const save = () => {
    saveToLocalStorage("settings_prefs", prefs);
    onSave();
  };

  return (
    <SectionCard title="Preferences" description="Customize ResumeXpert defaults.">
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Default resume length</Label>
            <Select value={prefs.resumeLength} onValueChange={(v) => setPrefs({ ...prefs, resumeLength: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 page</SelectItem>
                <SelectItem value="2">2 pages</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Default resume tone</Label>
            <Select value={prefs.resumeTone} onValueChange={(v) => setPrefs({ ...prefs, resumeTone: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="confident">Confident</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Default cover letter tone</Label>
            <Select value={prefs.coverTone} onValueChange={(v) => setPrefs({ ...prefs, coverTone: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="warm">Warm Professional</SelectItem>
                <SelectItem value="direct">Direct Professional</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Auto-save outputs to History</p>
            <p className="text-xs text-muted-foreground">Automatically save generated content.</p>
          </div>
          <Switch checked={prefs.autoSave} onCheckedChange={(v) => setPrefs({ ...prefs, autoSave: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium">Never invent experience</p>
              <p className="text-xs text-muted-foreground">Only rewrite what you provide.</p>
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent>This is always enabled for ethical reasons.</TooltipContent>
            </Tooltip>
          </div>
          <Switch checked disabled />
        </div>
      </div>
      <SaveBar onSave={save} />
    </SectionCard>
  );
}

function AppearanceSection({ onSave }: { onSave: () => void }) {
  const { theme, setTheme, reduceMotion, setReduceMotion } = useTheme();

  return (
    <SectionCard title="Appearance" description="Customize how ResumeXpert looks.">
      <div className="space-y-5">
        <div>
          <Label className="mb-2 block">Theme</Label>
          <div className="flex gap-3">
            {([
              { value: "light" as const, icon: Sun, label: "Light" },
              { value: "dark" as const, icon: Moon, label: "Dark" },
              { value: "system" as const, icon: Monitor, label: "System" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 px-5 py-3 rounded-lg border text-sm transition-all",
                  theme === opt.value
                    ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary/20"
                    : "border-border hover:bg-muted"
                )}
              >
                <opt.icon className="h-5 w-5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Reduce motion</p>
            <p className="text-xs text-muted-foreground">Stop animated backgrounds and transitions.</p>
          </div>
          <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
        </div>
      </div>
      <SaveBar onSave={onSave} />
    </SectionCard>
  );
}

function NotificationsSection({ onSave }: { onSave: () => void }) {
  const [notifs, setNotifs] = useState(() =>
    loadFromLocalStorage("settings_notifs", { weeklyTips: true, productUpdates: true, inApp: true })
  );

  const save = () => {
    saveToLocalStorage("settings_notifs", notifs);
    onSave();
  };

  return (
    <SectionCard title="Notifications" description="Control what notifications you receive.">
      <div className="space-y-4">
        {[
          { key: "weeklyTips" as const, title: "Weekly tips", desc: "Career tips and resume advice." },
          { key: "productUpdates" as const, title: "Product updates", desc: "New features and improvements." },
          { key: "inApp" as const, title: "In-app notifications", desc: "Activity and generation alerts." },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={notifs[item.key]}
              onCheckedChange={(v) => setNotifs({ ...notifs, [item.key]: v })}
            />
          </div>
        ))}
      </div>
      <SaveBar onSave={save} />
    </SectionCard>
  );
}

function SecuritySection() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <SectionCard title="Change password" description="Update your account password.">
        <div className="space-y-4 max-w-sm">
          <div>
            <Label htmlFor="current">Current password</Label>
            <Input id="current" type="password" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type="password" className="mt-1.5" />
          </div>
        </div>
        <div className="pt-5 border-t mt-6">
          <Button onClick={() => toast({ title: "Password updated", description: "Your password has been changed." })}>
            Update password
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Active sessions">
        <div className="space-y-3">
          {[
            { device: "Chrome · Windows", location: "Lagos, NG", status: "Active now" },
            { device: "Safari · macOS", location: "London, UK", status: "2 days ago" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{s.device}</p>
                <p className="text-xs text-muted-foreground">{s.location}</p>
              </div>
              <Badge variant={i === 0 ? "default" : "secondary"}>{s.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="rounded-xl border border-dashed p-6 text-center">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <h3 className="font-semibold mb-1">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

function BillingSection() {
  const currentPlan = loadFromLocalStorage("plan", "free");
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <SectionCard title="Current plan">
        <div className="flex items-center gap-3 mb-4">
          <Badge className="text-sm px-3 py-1">{currentPlan === "free" ? "Free" : currentPlan === "pro" ? "Pro" : "Team"}</Badge>
          {currentPlan === "free" && <span className="text-sm text-muted-foreground">Limited features</span>}
        </div>

        {currentPlan === "free" && (
          <div className="rounded-lg border bg-accent/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Upgrade to Pro</h4>
                <p className="text-sm text-muted-foreground">$4/month · 7-day free trial · No credit card required</p>
              </div>
              <Button onClick={() => {
                saveToLocalStorage("plan", "pro");
                toast({ title: "Upgraded to Pro!", description: "Enjoy unlimited features." });
              }}>
                Upgrade
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Invoices" description="Your billing history.">
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      </SectionCard>
    </div>
  );
}

function DataSection() {
  const [showDelete, setShowDelete] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <SectionCard title="Export data" description="Download a copy of your data.">
        <Button variant="outline" onClick={() => toast({ title: "Export started", description: "Your data export will be ready shortly." })}>
          Export all data
        </Button>
      </SectionCard>

      <div className="rounded-xl border border-destructive/30 bg-destructive/[0.03] p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">Danger zone</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete your account, settings, and all saved history. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => {
                    setShowDelete(false);
                    toast({ title: "Account deleted", description: "Your account has been removed.", variant: "destructive" });
                  }}>
                    Yes, delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpSection() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [feature, setFeature] = useState("");

  return (
    <div className="space-y-6">
      <SectionCard title="Contact support" description="Describe your issue and we'll get back to you.">
        <div className="space-y-4">
          <div>
            <Label htmlFor="support-msg">Message</Label>
            <Textarea
              id="support-msg"
              rows={4}
              placeholder="Describe your issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button onClick={() => {
            toast({ title: "Message sent", description: "We'll respond within 24 hours." });
            setMessage("");
          }}>
            Send
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Feature request" description="Suggest improvements or new features.">
        <div className="space-y-4">
          <Textarea
            rows={3}
            placeholder="I'd love to see..."
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
          />
          <Button variant="outline" onClick={() => {
            toast({ title: "Thanks!", description: "Your feedback has been recorded." });
            setFeature("");
          }}>
            Submit feedback
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Resources">
        <a href="/tips" className="flex items-center gap-2 text-sm text-primary hover:underline">
          <ExternalLink className="h-3.5 w-3.5" /> Browse FAQ & Tips
        </a>
      </SectionCard>
    </div>
  );
}
