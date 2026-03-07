import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface OutputPanelTab {
  id: string;
  label: string;
  content: string | React.ReactNode;
}

interface OutputPanelProps {
  title: string;
  tabs: OutputPanelTab[];
  className?: string;
  isLoading?: boolean;
}

export function OutputPanel({ title, tabs, className, isLoading }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const activeTab = tabs[0];
    if (typeof activeTab.content === "string") {
      await navigator.clipboard.writeText(activeTab.content);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("bg-card border rounded-xl p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Generating your content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border rounded-xl p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
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
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-2"
            title="Coming soon"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Tabs defaultValue={tabs[0]?.id} className="w-full">
        <TabsList className="mb-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {typeof tab.content === "string" ? (
              <div className="bg-muted/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {tab.content}
                </pre>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {tab.content}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
