import { useRef } from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useResumeUpload } from "@/lib/hooks/useResumeUpload";
import type { Resume } from "@/lib/types/resume";

type Props = {
  onUploaded: (resume: Resume) => void;
  compact?: boolean;
  className?: string;
};

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function ResumeUploader({ onUploaded, compact = false, className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { upload, isUploading, progress, error, resume } = useResumeUpload();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload({ file, label: file.name });
    if (result.kind === "ok") onUploaded(result.resume);
    // Reset the input so the same file can be re-uploaded after an error.
    if (inputRef.current) inputRef.current.value = "";
  };

  const status = resume ? (resume.parse_failed ? "soft-fail" : "ok") : null;

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl text-center bg-muted/20",
        compact ? "p-6" : "p-8",
        className,
      )}
    >
      <Upload
        className={cn(
          "mx-auto text-muted-foreground",
          compact ? "h-8 w-8 mb-2" : "h-10 w-10 mb-3",
        )}
      />
      <p className={cn("font-medium", compact ? "text-sm" : "mb-1")}>Upload Resume</p>
      <p className={cn("text-muted-foreground", compact ? "text-xs mt-1" : "text-sm mb-3")}>
        PDF or DOCX
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleSelect}
        disabled={isUploading}
        className="sr-only"
        id={compact ? "resume-upload-compact" : "resume-upload"}
      />
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="mt-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Parsing…
          </>
        ) : (
          "Choose file"
        )}
      </Button>

      {isUploading && (
        <div className="mt-4">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {progress < 60 ? "Uploading…" : "Extracting text…"}
          </p>
        </div>
      )}

      {!isUploading && status === "ok" && (
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Resume parsed
        </div>
      )}

      {!isUploading && status === "soft-fail" && (
        <div className="mt-4 flex items-start gap-2 text-left text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md p-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            We couldn&apos;t fully parse your resume — some sections may be missing. You
            can edit the text below.
          </span>
        </div>
      )}

      {!isUploading && error && (
        <div className="mt-4 flex items-start gap-2 text-left text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
