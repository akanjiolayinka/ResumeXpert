// Sample profiles for the resume builder
// Resume generation templates
// Keyword extraction (simple)
export function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "shall", "can", "need", "about", "into", "through", "during", "before", "after",
    "above", "below", "between", "under", "again", "further", "then", "once", "here",
    "there", "when", "where", "why", "how", "all", "each", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "just", "also", "now", "you", "your", "we", "our", "their", "this",
    "that", "these", "those", "i", "me", "my", "myself", "we", "ourselves", "he", "him",
    "his", "she", "her", "it", "its", "they", "them", "who", "which", "what", "whom",
    "experience", "work", "job", "role", "position", "team", "company", "ability",
    "strong", "excellent", "good", "great", "well", "new", "years", "year", "looking",
    "including", "working", "using", "etc", "requirements", "required", "preferred",
  ]);
  
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
  
  const wordCount: Record<string, number> = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

// ATS Score calculation
export function calculateATSScore(resumeText: string, jobDescription?: string): {
  overall: number;
  keywordMatch: number;
  structure: number;
  formatting: number;
  impact: number;
  missingKeywords: string[];
  fixes: { priority: "high" | "medium" | "low"; text: string }[];
} {
  let score = 60;
  let keywordMatch = 50;
  let structure = 50;
  let formatting = 70;
  let impact = 50;
  const fixes: { priority: "high" | "medium" | "low"; text: string }[] = [];
  let missingKeywords: string[] = [];
  
  const resumeLower = resumeText.toLowerCase();
  
  // Check for standard headings
  const headings = ["summary", "skills", "experience", "education", "projects"];
  const foundHeadings = headings.filter(h => resumeLower.includes(h));
  if (foundHeadings.length >= 4) {
    score += 10;
    structure = 80;
  } else {
    fixes.push({ priority: "medium", text: "Use standard headings: Summary, Skills, Experience, Education" });
    structure = 40;
  }
  
  // Check for metrics/numbers
  const hasMetrics = /\d+%|\$\d+|\d+ (users|customers|clients|projects|tickets)/i.test(resumeText);
  if (hasMetrics) {
    score += 10;
    impact = 80;
  } else {
    fixes.push({ priority: "high", text: "Add 2–3 measurable outcomes (numbers, %, time saved, users)" });
    impact = 30;
  }
  
  // Check length
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 200) {
    score -= 10;
    fixes.push({ priority: "high", text: "Resume seems too short. Add more details about your experience and projects." });
  }
  
  // Check for formatting issues
  const hasEmojis = /[\u{1F600}-\u{1F6FF}]/u.test(resumeText);
  const hasTooManyPipes = (resumeText.match(/\|/g) || []).length > 15;
  if (hasEmojis || hasTooManyPipes) {
    score -= 10;
    formatting = 40;
    fixes.push({ priority: "medium", text: "Keep formatting ATS-safe (avoid tables, columns, graphics, emojis)" });
  } else {
    formatting = 80;
  }
  
  // Keyword matching with job description
  if (jobDescription) {
    const jdKeywords = extractKeywords(jobDescription);
    const resumeKeywords = new Set(extractKeywords(resumeText));
    const matched = jdKeywords.filter(k => resumeKeywords.has(k));
    missingKeywords = jdKeywords.filter(k => !resumeKeywords.has(k)).slice(0, 10);
    
    if (matched.length >= 8) {
      score += 10;
      keywordMatch = 85;
    } else if (matched.length >= 4) {
      keywordMatch = 60;
    } else {
      keywordMatch = 30;
      fixes.push({ priority: "high", text: "Align skills and keywords with the job description" });
    }
  }
  
  // Common fixes
  fixes.push({ priority: "high", text: 'Convert weak bullets into "Action + What + Result"' });
  fixes.push({ priority: "medium", text: "Use consistent dates (Month Year – Month Year)" });
  fixes.push({ priority: "low", text: "Add portfolio links if you have them" });
  fixes.push({ priority: "low", text: "Remove filler words and tighten summary" });
  
  // Clamp score
  const overall = Math.max(0, Math.min(100, score));
  
  return {
    overall,
    keywordMatch,
    structure,
    formatting,
    impact,
    missingKeywords,
    fixes: fixes.slice(0, 8),
  };
}

// Cover letter generation
export function generateCoverLetter(data: {
  roleTitle: string;
  companyName: string;
  jobDescription: string;
  proofPoints: string[];
  fullName?: string;
  tone: "warm" | "direct" | "enthusiastic";
}): string {
  const jdKeywords = extractKeywords(data.jobDescription);
  const topSkills = jdKeywords.slice(0, 3).join(", ") || "relevant skills";
  
  const proofs = data.proofPoints.length > 0 
    ? data.proofPoints.slice(0, 3)
    : [
        "Delivered projects on time while maintaining high quality standards",
        "Collaborated with cross-functional teams to solve complex problems",
        "Continuously improved processes to increase efficiency",
      ];
  
  const toneIntros = {
    warm: "I'm excited to apply for",
    direct: "I'm writing to apply for",
    enthusiastic: "I'm thrilled to apply for",
  };
  
  const toneClosings = {
    warm: "I'd love the opportunity to discuss how I can contribute to your team.",
    direct: "I look forward to discussing how my skills align with your needs.",
    enthusiastic: "I'm eager to bring my passion and skills to your team!",
  };

  return `Dear Hiring Manager,

${toneIntros[data.tone]} the ${data.roleTitle} role at ${data.companyName}. After reviewing the job description, I'm confident my background in ${topSkills} aligns closely with what your team needs.

In previous projects and roles, I've delivered results by:
• ${proofs[0]}
• ${proofs[1]}
• ${proofs[2]}

What excites me about ${data.companyName} is the opportunity to work on meaningful challenges and contribute to a team that values quality and innovation. I'm especially drawn to the chance to apply my skills in ${topSkills} while bringing a strong focus on clarity and measurable outcomes.

${toneClosings[data.tone]} Thank you for your time and consideration.

Sincerely,
${data.fullName || "[Your Name]"}`;
}

// Chatbot canned responses
export const chatbotResponses = [
  "Share the job description + your current bullet and I'll rewrite it into: Action + What + Result. If you have numbers (time saved, users, %), include them!",
  "For a strong resume summary, focus on: 1) Your role/title, 2) Key skills relevant to the job, 3) What you're looking to achieve. Keep it 2-3 lines max.",
  "Here's a formula for impactful bullets: [Strong verb] + [What you did] + [Result or metric]. Example: 'Reduced page load time by 18% by optimizing component rendering.'",
  "When highlighting skills, prioritize those mentioned in the job description. Put technical skills first, then tools, then soft skills.",
  "Common interview questions for this type of role: 1) Tell me about yourself, 2) Walk me through a challenging project, 3) How do you handle tight deadlines?",
  "For your summary, I'd suggest leading with your strongest qualification that matches the job. What's the #1 thing you want them to know about you?",
  "To strengthen that bullet, add a specific outcome. Instead of 'Worked on features,' try 'Shipped 5 features that improved user engagement by 12%.'",
  "Good ATS-friendly headings to use: Professional Summary, Skills, Experience, Projects, Education, Certifications. Avoid creative alternatives.",
  "For entry-level resumes, projects are just as valuable as work experience. Make sure to quantify your project outcomes where possible.",
  "Want me to suggest some action verbs? Try: Built, Designed, Implemented, Optimized, Led, Collaborated, Delivered, Improved, Reduced, Increased.",
];
