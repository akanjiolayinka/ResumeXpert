import { z } from "zod";

// Builder form schemas. Textarea-backed list fields (bullets, metrics,
// certifications, …) are stored as raw strings in the form and split into
// arrays at save time — see src/lib/export/resumeFormToRawText.ts.

export const experienceSchema = z.object({
  company: z.string().trim().min(1, "Company is required"),
  role: z.string().trim().min(1, "Role is required"),
  dates: z.string().trim().min(1, "Dates are required"),
  bullets: z.string().optional(),
  metrics: z.string().optional(),
});
export type ExperienceValues = z.infer<typeof experienceSchema>;

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  link: z.string().optional(),
  stack: z.string().optional(),
  bullets: z.string().optional(),
  results: z.string().optional(),
});
export type ProjectValues = z.infer<typeof projectSchema>;

export const educationSchema = z.object({
  school: z.string().trim().min(1, "School is required"),
  degree: z.string().trim().min(1, "Degree is required"),
  dates: z.string().trim().min(1, "Dates are required"),
  gpa: z.string().optional(),
});
export type EducationValues = z.infer<typeof educationSchema>;

export const resumeFormSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  summary: z.string().optional(),
  // Comma-separated in the form; mapped to string[] on save. At least one
  // skill is recommended but not enforced.
  skills: z.string().optional(),
  experiences: z.array(experienceSchema),
  projects: z.array(projectSchema),
  education: z.array(educationSchema),
  certifications: z.string().optional(),
  awards: z.string().optional(),
  volunteering: z.string().optional(),
  // Tailoring inputs — optional; "Tailor to this JD" is enabled when
  // jobDescription is non-empty.
  jobDescription: z.string().optional(),
  companyName: z.string().optional(),
  roleTitle: z.string().optional(),
  onePageOnly: z.boolean(),
});
export type ResumeFormValues = z.infer<typeof resumeFormSchema>;

export const emptyResumeForm: ResumeFormValues = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  portfolio: "",
  summary: "",
  skills: "",
  experiences: [],
  projects: [],
  education: [],
  certifications: "",
  awards: "",
  volunteering: "",
  jobDescription: "",
  companyName: "",
  roleTitle: "",
  onePageOnly: true,
};
