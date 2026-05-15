import { z } from "zod";

export const tailorRequestSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(100, "Paste at least 100 characters of resume text, or upload a resume."),
  jobDescription: z
    .string()
    .trim()
    .min(50, "Paste at least 50 characters of job description."),
  roleTitle: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
});

export type TailorRequestValues = z.infer<typeof tailorRequestSchema>;
