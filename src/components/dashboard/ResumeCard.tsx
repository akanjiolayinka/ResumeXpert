import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Pencil,
  Star,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteResume,
  useSetDefaultResume,
} from "@/lib/queries/resumes";
import type { Resume } from "@/lib/types/resume";

type Props = {
  resume: Resume;
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function ResumeCard({ resume }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setDefault = useSetDefaultResume();
  const deleteResume = useDeleteResume();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sourceLabel = resume.source_kind === "upload" ? "Upload" : "Manual";

  const handleSetDefault = async () => {
    try {
      await setDefault.mutateAsync(resume.id);
      toast({ title: "Default updated", description: `${resume.label} is now your default.` });
    } catch (err) {
      toast({
        title: "Couldn't set default",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteResume.mutateAsync(resume.id);
      toast({ title: "Deleted", description: `${resume.label} was removed.` });
      setConfirmOpen(false);
    } catch (err) {
      toast({
        title: "Couldn't delete",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            {resume.label}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="gap-1 text-[10px]">
              {resume.source_kind === "upload" ? (
                <Upload className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
              {sourceLabel}
            </Badge>
            {resume.is_default && (
              <Badge className="gap-1 text-[10px] bg-primary/15 text-primary hover:bg-primary/15 border-primary/20">
                <Star className="h-3 w-3 fill-current" />
                Default
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              · {formatDate(resume.created_at)}
            </span>
          </div>
        </div>
      </div>

      {resume.parse_failed && (
        <div className="flex items-start gap-2 text-xs rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Partially parsed — some sections may be missing.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          size="sm"
          variant="default"
          className="gap-1.5"
          onClick={() => navigate(`/resume-tailor?base_resume_id=${resume.id}`)}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Tailor to a job
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => navigate(`/resume-builder?resume_id=${resume.id}`)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={handleSetDefault}
          disabled={resume.is_default || setDefault.isPending}
          title={resume.is_default ? "Already your default" : "Set as default"}
        >
          {setDefault.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className="h-3.5 w-3.5" />
          )}
          Set as default
        </Button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
              <AlertDialogDescription>
                {resume.is_default ? (
                  <>
                    This is your <strong>default resume</strong>. Deleting it removes the
                    default — you can pick another one afterwards. This can&apos;t be
                    undone.
                  </>
                ) : (
                  <>This permanently removes {resume.label}. This can&apos;t be undone.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handleDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteResume.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
