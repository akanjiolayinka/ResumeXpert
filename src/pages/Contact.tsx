import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MarketingLayout as Layout, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
  message: z.string().trim().min(10, "Please share at least a sentence (10+ characters)").max(5000),
});
type ContactValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = async (data: ContactValues) => {
    setSubmitted(false);
    const { error } = await supabase.functions.invoke("support-message", {
      body: {
        kind: "support",
        name: data.name,
        email: data.email,
        message: data.message,
      },
    });
    if (error) {
      toast({
        title: "Failed to send",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }
    reset({ name: "", email: "", message: "" });
    setSubmitted(true);
  };

  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Contact Us"
          description="Have questions, feedback, or need help? We'd love to hear from you."
        />

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-xl font-bold mb-6">Send us a message</h2>

              {submitted ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Message sent</p>
                    <p className="text-sm text-green-700/80 dark:text-green-300/80 mt-0.5">
                      We will be in touch soon.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="text-xs text-green-700 dark:text-green-300 mt-2 underline underline-offset-2 hover:no-underline"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" placeholder="John Doe" className="mt-1.5" {...register("name")} />
                    {errors.name && (
                      <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="mt-1.5"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help?"
                      rows={5}
                      className="mt-1.5"
                      {...register("message")}
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-xl font-bold mb-6">Other ways to reach us</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-muted-foreground">hello@resumexpert.com</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We typically respond within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Live Chat</h3>
                    <p className="text-muted-foreground">Coming soon</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      In-app support for premium users.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">Looking for quick answers?</h3>
                <p className="text-sm text-muted-foreground">
                  Check our FAQ section on the home page for common questions about ResumeXpert.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
