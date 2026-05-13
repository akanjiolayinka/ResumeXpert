import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { signupSchema, type SignupValues } from "@/lib/schemas/auth";

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", agreed: false },
  });

  const onSubmit = async (values: SignupValues) => {
    setServerError(null);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.name } },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    // No session means email confirmation is required, OR the email is already
    // registered (Supabase returns a privacy-preserving identities=[] response).
    // Show the same "check your email" message in both cases — never leak which.
    if (!data.session) {
      setPendingConfirmation(true);
      return;
    }

    navigate(redirect, { replace: true });
  };

  if (pendingConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            ResumeTailor
          </Link>
          <div className="p-6 rounded-lg bg-accent text-accent-foreground space-y-2">
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="text-sm">
              We&apos;ve sent a confirmation link to {form.getValues("email")}. Click it to finish
              creating your account.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Already confirmed?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-xl mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            ResumeTailor
          </Link>
          {searchParams.has("redirect") && (
            <div className="mt-4 p-3 rounded-lg bg-accent text-accent-foreground text-sm">
              Create a free account to continue.
            </div>
          )}
          <h1 className="text-2xl font-bold mt-4">Create your ResumeTailor account</h1>
        </div>

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your name" autoComplete="name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="At least 8 characters, including a digit"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agreed"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <label className="text-sm text-muted-foreground leading-snug">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create account
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
