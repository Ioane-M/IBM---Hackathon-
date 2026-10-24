import type { Level } from "./types";

export const LEVEL_NAMES: Record<Level, string> = {
  1: "Starting out",
  2: "Building",
  3: "Confident",
};

/** What the tutor changes at each level. Shown to the student as a short tag. */
export const LEVEL_STYLE: Record<Level, string> = {
  1: "simple words, analogy, small steps",
  2: "precise terms, shorter hints",
  3: "precise terms, a challenge",
};

/** The instruction given to the model for each level. */
export const LEVEL_INSTRUCTION: Record<Level, string> = {
  1: "Student level: STARTING OUT. Use simple everyday words, one idea at a time, an analogy, and a very small step. Name the precise term once, after the plain version.",
  2: "Student level: BUILDING. Use the precise terms with a short plain-English gloss. Keep hints brief. No analogy unless they struggle.",
  3: "Student level: CONFIDENT. Be concise and precise. Skip the analogy. Finish with a short challenge: ask them to try the similar problem and explain why it works.",
};

export function clampLevel(n: unknown): Level | null {
  if (n === 1 || n === 2 || n === 3) return n;
  if (typeof n === "string" && /^[123]$/.test(n)) return Number(n) as Level;
  return null;
}

/** Move the level after a step, from how the student actually did. */
export function adjustLevel(
  level: Level | null,
  event: "first_try" | "struggled"
): { level: Level; reason: string } | null {
  if (level === null) return null;
  if (event === "first_try" && level < 3) {
    return {
      level: (level + 1) as Level,
      reason: "Explained it correctly on the first try, so the next steps use more precise terms.",
    };
  }
  if (event === "struggled" && level > 1) {
    return {
      level: (level - 1) as Level,
      reason: "Needed more than one try, so the next steps use simpler words and smaller steps.",
    };
  }
  return null;
}
