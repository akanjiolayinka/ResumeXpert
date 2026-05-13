// Rate-limit constants shared by edge functions. Verify current values at
// https://console.groq.com before launch — Groq adjusts free-tier limits
// without notice.

// ── Per-user app limits ────────────────────────────────────────────────────
// Enforced by edge functions counting recent rows for the requesting user.

/** Tailoring pipeline runs per user per 24h. Verify current free-tier limits at console.groq.com before launch. */
export const MAX_TAILORINGS_PER_DAY = 20;

/** Chat messages (role='user') per user per 24h. Verify current free-tier limits at console.groq.com before launch. */
export const MAX_CHAT_MESSAGES_PER_DAY = 100;

// ── Groq provider limits ───────────────────────────────────────────────────
// Used for pre-flight token-budget rejections in long-input cases.

/** Verify current free-tier limits at console.groq.com before launch. */
export const GROQ_REQUESTS_PER_MINUTE = 30;

/** Verify current free-tier limits at console.groq.com before launch. */
export const GROQ_REQUESTS_PER_DAY = 14_400;

/** Llama 3.3 70B input tokens per minute. Verify current free-tier limits at console.groq.com before launch. */
export const GROQ_TOKENS_PER_MINUTE_70B = 6_000;

/** Llama 3.3 70B output tokens per minute. Verify current free-tier limits at console.groq.com before launch. */
export const GROQ_OUTPUT_TOKENS_PER_MINUTE_70B = 12_000;

// ── Input token budget ─────────────────────────────────────────────────────
// Rough token-count estimate (chars / 4) used in pre-flight checks to avoid
// burning a request on input that will fail provider-side anyway.

/** Estimated input-token ceiling per tailoring/scoring call. */
export const MAX_INPUT_TOKENS = 8_000;

/** chars-per-token estimate. tiktoken-quality counts aren't worth the dep for v1. */
export const CHARS_PER_TOKEN_ESTIMATE = 4;
