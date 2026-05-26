import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ResumeStructuredData } from "@/lib/export/ResumeDocument";

type Props = {
  /** The tailored_resumes.structured (or resumes.structured) jsonb object. */
  structured: ResumeStructuredData;
  roleTitle?: string | null;
  companyName?: string | null;
  /** Render a smaller trigger for dense contexts like table rows. */
  size?: "sm" | "default";
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildFilename(roleTitle?: string | null, companyName?: string | null): string {
  const parts = [roleTitle, companyName].map((p) => (p ? slugify(p) : "")).filter(Boolean);
  const base = parts.length > 0 ? parts.join("-") : "tailored";
  return `${base}-resume.pdf`;
}

export function ExportMenu({ structured, roleTitle, companyName, size = "sm" }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      // Lazy-load react-pdf (and the document, which pulls it in) so the
      // heavy renderer is code-split out of the main bundle and only fetched
      // when a user actually exports.
      const [{ pdf }, { ResumeDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/export/ResumeDocument"),
      ]);
      const blob = await pdf(<ResumeDocument data={structured} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildFilename(roleTitle, companyName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not generate the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className="gap-2" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2">
          <FileText className="h-4 w-4" />
          Download as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
