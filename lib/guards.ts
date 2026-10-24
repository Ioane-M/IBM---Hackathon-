import type { TutorResponse, ValidatorResult } from "./types";
import { clampLevel } from "./levels";

// ── wordCount ──────────────────────────────────────────────────────────────

/** Count words in a string (splits on whitespace). */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── overlapRatio ───────────────────────────────────────────────────────────

/**
 * Fraction of the student's word 4-grams that appear in the last AI
 * explanation. Used to detect copy-paste teach-backs.
 * Returns 0 if the student text has fewer than 4 words.
 */
export function overlapRatio(studentText: string, lastAiText: string): number {
  const studentWords = tokenize(studentText);
  const aiWords = tokenize(lastAiText);

  if (studentWords.length < 4) return 0;

  const aiNgrams = new Set(ngrams(aiWords, 4).map((g) => g.join(" ")));
  const studentNgrams = ngrams(studentWords, 4);

  if (studentNgrams.length === 0) return 0;

  const matched = studentNgrams.filter((g) => aiNgrams.has(g.join(" "))).length;
  return matched / studentNgrams.length;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function ngrams(words: string[], n: number): string[][] {
  const result: string[][] = [];
  for (let i = 0; i <= words.length - n; i++) {
    result.push(words.slice(i, i + n));
  }
  return result;
}

// ── leaksAnswer ────────────────────────────────────────────────────────────

/**
 * True if the text contains any forbidden answer pattern.
 * Case-insensitive, ignores spaces, and treats the Unicode minus as "-".
 */
export function leaksAnswer(aiText: string, forbiddenPatterns: string[]): boolean {
  const norm = (t: string) => t.toLowerCase().replace(/\u2212/g, "-").replace(/\s+/g, "");
  const text = norm(aiText);
  return forbiddenPatterns.some((p) => {
    const needle = norm(p);
    let from = 0;
    for (;;) {
      const i = text.indexOf(needle, from);
      if (i === -1) return false;
      // "x=2" must not match inside "x=20" or "x=2.5"
      const next = text[i + needle.length] ?? "";
      if (!/[0-9]/.test(next) && !(next === "." && /[0-9]/.test(text[i + needle.length + 1] ?? ""))) return true;
      from = i + 1;
    }
  });
}

/** Check every student-visible field of a tutor response, not only the message. */
export function responseLeaks(r: TutorResponse, forbidden: string[]): boolean {
  const all = [r.message, r.next_question ?? "", ...(r.feedback_points ?? [])].join(" \n ");
  return leaksAnswer(all, forbidden);
}

// ── JSON parsing ───────────────────────────────────────────────────────────

/** Strip code fences and any text around the outermost JSON object. */
function extractJson(text: string): unknown {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(stripped.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/**
 * Parse and validate the tutor contract. Missing optional fields get safe
 * defaults. Returns null if type or message are unusable.
 */
export function parseJsonStrict(text: string): TutorResponse | null {
  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const validTypes = ["probe", "explain", "teach_back", "validate", "hint", "refuse"];
  if (!validTypes.includes(obj.type as string)) return null;
  if (typeof obj.message !== "string" || obj.message.trim() === "") return null;

  const flags = (obj.flags && typeof obj.flags === "object" ? obj.flags : {}) as Record<string, unknown>;

  return {
    type: obj.type as TutorResponse["type"],
    message: obj.message,
    verdict: null,
    feedback_points: Array.isArray(obj.feedback_points)
      ? obj.feedback_points.filter((p): p is string => typeof p === "string")
      : [],
    next_question: typeof obj.next_question === "string" ? obj.next_question : null,
    hint_level: typeof obj.hint_level === "number" ? obj.hint_level : 0,
    flags: {
      unsupported_claim: flags.unsupported_claim === true,
      reason: typeof flags.reason === "string" ? flags.reason : null,
    },
    student_level: clampLevel(obj.student_level),
    level_reason: typeof obj.level_reason === "string" ? obj.level_reason : null,
  };
}

/** Parse the validator JSON. Returns null on failure. */
export function parseValidatorJson(
  text: string
): Omit<ValidatorResult, "unlocked"> | null {
  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const validVerdicts = ["understood", "partial", "missing"];
  if (!validVerdicts.includes(obj.verdict as string)) return null;

  const strings = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  return {
    verdict: obj.verdict as ValidatorResult["verdict"],
    covered: strings(obj.covered),
    missing: strings(obj.missing),
    follow_up: typeof obj.follow_up === "string" ? obj.follow_up : null,
  };
}

// ── Input hygiene ──────────────────────────────────────────────────────────

/** Cap the length of student text before it goes into a prompt. */
export function clip(text: unknown, max = 1200): string {
  return typeof text === "string" ? text.slice(0, max) : "";
}
