import { Link } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumes } from "@/lib/queries/resumes";
import { useTailoringJobs } from "@/lib/queries/tailoringJobs";
import { useProfile } from "@/lib/queries/profile";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { TailoringHistoryTable } from "@/components/dashboard/TailoringHistoryTable";
import { ATSScoreChart } from "@/components/dashboard/ATSScoreChart";

function firstName(full: string | null | undefined, fallbackEmail: string | null | undefined): string | undefined {
  if (full) {
    const name = full.trim().split(/\s+/)[0];
    if (name) return name;
  }
  if (fallbackEmail) {
    // Strip everything after "@" and "+" alias suffixes, then prettify.
    const local = fallbackEmail.split("@")[0].split("+")[0];
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return undefined;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const { isLoading: jobsLoading } = useTailoringJobs();

  const name = firstName(profile?.full_name, user?.email);
  const initialLoading = profileLoading || resumesLoading || jobsLoading;

  return (
    <Layout>
      <div className="page-container section-spacing">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {name ? `Welcome back, ${name}.` : "Welcome back."}
            </h1>
            <p className="text-muted-foreground mt-1">
              Your resumes, tailoring history, and ATS score trend.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/resume-tailor">
              <Wand2 className="h-4 w-4" />
              Tailor a new resume
            </Link>
          </Button>
        </div>

        {initialLoading ? (
          <LoadingSkeleton />
        ) : (resumes?.length ?? 0) === 0 ? (
          <EmptyDashboard firstName={name} />
        ) : (
          <div className="space-y-10">
            {/* Resumes */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Your Resumes</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(resumes ?? []).map((r) => (
                  <ResumeCard key={r.id} resume={r} />
                ))}
              </div>
            </section>

            {/* Tailoring history */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Tailoring History</h2>
              <TailoringHistoryTable />
            </section>

            {/* ATS score trend (self-hides when <2 scores) */}
            <section>
              <ATSScoreChart />
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-10">
      <section>
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="h-6 w-44 mb-3" />
        <div className="rounded-xl border bg-card p-4 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
