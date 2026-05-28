import type { ResumeFormValues } from "@/lib/schemas/resume";

// Sample profiles for the Builder "Use a sample" dropdown (KL7 — moved out of
// resume-utils.ts). Shaped as full ResumeFormValues so the dropdown can call
// reset(profile) directly on the RHF form.

export const sampleProfiles: Record<string, { label: string; data: ResumeFormValues }> = {
  techGraduate: {
    label: "Tech graduate",
    data: {
      fullName: "Adebayo Okonkwo",
      email: "adebayo.okonkwo@email.com",
      phone: "+234 801 234 5678",
      location: "Lagos, Nigeria",
      linkedin: "linkedin.com/in/adebayo-okonkwo",
      portfolio: "github.com/adebayo-okonkwo",
      summary:
        "Recent computer science graduate with hands-on experience building web applications using React and Node.js. Passionate about clean code and solving real-world problems through technology.",
      skills: "JavaScript, React, Node.js, Python, Git, SQL, HTML/CSS, REST APIs",
      experiences: [
        {
          company: "TechStart Nigeria",
          role: "Software Development Intern",
          dates: "Jun 2023 - Dec 2023",
          bullets:
            "Built responsive web interfaces using React\nCollaborated with senior developers on API integration\nReduced page load time by 30% through code optimization",
          metrics: "30% faster page loads",
        },
      ],
      projects: [
        {
          name: "Campus Marketplace",
          link: "github.com/adebayo-okonkwo/campus-market",
          stack: "React, Node.js, PostgreSQL",
          bullets:
            "Built a peer-to-peer marketplace for university students\nImplemented auth, listings, and in-app messaging",
          results: "200+ student sign-ups in the first month",
        },
      ],
      education: [
        {
          school: "University of Lagos",
          degree: "B.Sc. Computer Science",
          dates: "2019 - 2023",
          gpa: "Second Class Upper",
        },
      ],
      certifications: "Meta Front-End Developer Professional Certificate",
      awards: "",
      volunteering: "Mentor, UNILAG Coding Club",
      jobDescription: "",
      companyName: "",
      roleTitle: "",
      onePageOnly: true,
    },
  },
  marketingPro: {
    label: "Marketing professional",
    data: {
      fullName: "Chioma Eze",
      email: "chioma.eze@email.com",
      phone: "+234 802 345 6789",
      location: "Abuja, Nigeria",
      linkedin: "linkedin.com/in/chioma-eze",
      portfolio: "",
      summary:
        "Results-driven digital marketer with 3+ years of experience growing brand presence and driving engagement across social platforms.",
      skills:
        "Social Media Marketing, SEO, Content Strategy, Google Analytics, Email Marketing, Copywriting",
      experiences: [
        {
          company: "BrandHub Africa",
          role: "Marketing Executive",
          dates: "Jan 2021 - Present",
          bullets:
            "Managed social media campaigns reaching 500K+ users\nIncreased engagement by 45%\nLed content strategy for 10+ brand accounts",
          metrics: "45% engagement lift; 500K+ reach",
        },
      ],
      projects: [],
      education: [
        {
          school: "Ahmadu Bello University",
          degree: "B.A. Mass Communication",
          dates: "2016 - 2020",
          gpa: "",
        },
      ],
      certifications: "Google Digital Marketing & E-commerce Certificate",
      awards: "Top Performer, BrandHub Africa 2022",
      volunteering: "",
      jobDescription: "",
      companyName: "",
      roleTitle: "",
      onePageOnly: true,
    },
  },
};
