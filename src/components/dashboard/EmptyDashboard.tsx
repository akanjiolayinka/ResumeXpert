import { Link } from "react-router-dom";
import { FileText, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  firstName?: string;
};

export function EmptyDashboard({ firstName }: Props) {
  return (
    <div className="rounded-xl border bg-card p-8 sm:p-12 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5">
        <FileText className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold mb-1">
        {firstName ? `Welcome, ${firstName}.` : "Welcome to ResumeTailor."}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        Let&apos;s get started. Upload an existing resume or build one from scratch — then
        tailor it to any job in a few seconds.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild className="gap-2">
          <Link to="/resume-tailor">
            <Upload className="h-4 w-4" />
            Upload my resume
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/resume-builder">
            <Wand2 className="h-4 w-4" />
            Build from scratch
          </Link>
        </Button>
      </div>
    </div>
  );
}
