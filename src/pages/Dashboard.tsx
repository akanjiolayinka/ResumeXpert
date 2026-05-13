import { Layout, PageHeader } from "@/components/layout";

export default function Dashboard() {
  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Dashboard"
          description="Your resumes, tailoring history, and ATS scores."
        />
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">
            Dashboard ships in task Fi8 — for now this route exists so signup and login
            have a real protected destination.
          </p>
        </div>
      </div>
    </Layout>
  );
}
