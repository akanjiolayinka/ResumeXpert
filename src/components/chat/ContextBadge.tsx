import { FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  resumeLabel?: string | null;
  roleTitle?: string | null;
  companyName?: string | null;
};

/**
 * Subtle header strip telling the user whether the chat has a tailoring
 * context attached. With context, the assistant gets the resume + JD; without
 * it, replies are general career advice.
 */
export function ContextBadge({ resumeLabel, roleTitle, companyName }: Props) {
  const hasContext = !!(resumeLabel || roleTitle || companyName);

  const roleLine = [roleTitle, companyName].filter(Boolean).join(" @ ");

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-xs border-b",
        hasContext
          ? "bg-primary/5 text-foreground"
          : "bg-muted/40 text-muted-foreground",
      )}
    >
      {hasContext ? (
        <>
          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            <span className="font-medium">Context:</span>{" "}
            {resumeLabel ?? "Your resume"}
            {roleLine ? <span className="text-muted-foreground"> · {roleLine}</span> : null}
          </span>
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>No context — replies will be general career advice</span>
        </>
      )}
    </div>
  );
}
