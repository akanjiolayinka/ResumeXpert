import { z } from "zod";

const passwordWithDigit = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must include at least one digit");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Please enter a valid email"),
  password: passwordWithDigit,
  agreed: z.boolean().refine((v) => v === true, {
    message: "You must agree to the Terms and Privacy Policy",
  }),
});
export type SignupValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordWithDigit,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
