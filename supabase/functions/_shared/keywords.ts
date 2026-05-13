// Keyword extraction + overlap helpers. Ported from src/lib/resume-utils.ts
// per kill-list KL9. The client copy is deleted by I6; until then both exist
// briefly while features migrate.
//
// These helpers are intentionally simple — keyword scoring is a baseline that
// the LLM augments rather than replaces. score-ats passes the overlap report
// from here into the prompt as ground truth so the model doesn't recount.

const STOPWORDS = new Set<string>([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "shall", "can", "need", "about", "into", "through", "during", "before", "after",
  "above", "below", "between", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
  "too", "very", "just", "also", "now", "you", "your", "we", "our", "their", "this",
  "that", "these", "those", "i", "me", "my", "myself", "ourselves", "he", "him",
  "his", "she", "her", "it", "its", "they", "them", "who", "which", "what", "whom",
  "experience", "work", "job", "role", "position", "team", "company", "ability",
  "strong", "excellent", "good", "great", "well", "new", "years", "year", "looking",
  "including", "working", "using", "etc", "requirements", "required", "preferred",
]);

/**
 * Returns up to `limit` keywords from `text`, ordered by frequency descending.
 * Lowercase, punctuation-stripped, stopword-filtered, min length 3.
 */
export function extractKeywords(text: string, limit = 15): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export type KeywordOverlap = {
  matched: string[];
  missing: string[];
  /** Ratio of matched / total JD keywords, scaled to 0..100 and rounded. */
  overlapScore: number;
};

/**
 * Compares the JD's top keywords against the resume's keyword set. Used by
 * score-ats as ground-truth overlap, fed into the LLM prompt so the model
 * focuses on rationale rather than counting.
 */
export function computeKeywordOverlap(
  resumeText: string,
  jdText: string,
): KeywordOverlap {
  const jdKeywords = extractKeywords(jdText);
  if (jdKeywords.length === 0) {
    return { matched: [], missing: [], overlapScore: 0 };
  }
  const resumeKeywords = new Set(extractKeywords(resumeText, 50));
  const matched = jdKeywords.filter((k) => resumeKeywords.has(k));
  const missing = jdKeywords.filter((k) => !resumeKeywords.has(k));
  const overlapScore = Math.round((matched.length / jdKeywords.length) * 100);
  return { matched, missing, overlapScore };
}
