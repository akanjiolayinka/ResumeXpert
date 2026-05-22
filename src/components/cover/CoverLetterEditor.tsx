import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Copy, Check, RefreshCw, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateCoverLetter, type CoverLetter } from "@/lib/queries/coverLetters";

type Props = {
  coverLetter: CoverLetter;
  onRegenerate: () => void;
  isRegenerating?: boolean;
};

export function CoverLetterEditor({ coverLetter, onRegenerate, isRegenerating }: Props) {
  const [body, setBody] = useState(coverLetter.body);
  const [copied, setCopied] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { toast } = useToast();
  const updateMut = useUpdateCoverLetter();

  // Re-sync when the parent swaps in a different letter (e.g. after Regenerate).
  useEffect(() => {
    setBody(coverLetter.body);
    setJustSaved(false);
  }, [coverLetter.id, coverLetter.body]);

  const isDirty = body !== coverLetter.body;
  const charCount = body.length;
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    toast({ title: "Copied!", description: "Cover letter copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({ id: coverLetter.id, body });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save your edits.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-semibold text-lg">Your Cover Letter</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {coverLetter.role_title} · {coverLetter.company_name} ·{" "}
            <span className="capitalize">{coverLetter.tone}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={isRegenerating}>
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Regenerating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Replace your current letter?</AlertDialogTitle>
                <AlertDialogDescription>
                  Regenerating will replace the current letter — including any edits you&apos;ve made.
                  Make sure you&apos;ve copied or saved anything you want to keep.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRegenerate}>Yes, regenerate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || updateMut.isPending}
            className="gap-2"
          >
            {updateMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : justSaved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={18}
        className="font-mono text-sm leading-relaxed"
        spellCheck
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {wordCount} words
          </Badge>
          <span>{charCount} characters</span>
        </div>
        {isDirty && (
          <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
