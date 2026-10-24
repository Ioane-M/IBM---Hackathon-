/**
 * Offline checks for the code-level rules. No API key needed.
 * Run: npx tsx scripts/check-guards.ts
 */
import { leaksAnswer, overlapRatio, parseJsonStrict, parseValidatorJson, responseLeaks, wordCount } from "../lib/guards";
import { adjustLevel } from "../lib/levels";
import { mockValidate, mockTutor } from "../lib/mock";
import { loadLesson } from "../lib/lesson";

let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed++;
}

const lesson = loadLesson("quadratics");
const forbidden = lesson.homeworkProblem.forbiddenAnswerPatterns;

check("wordCount counts words", wordCount("  one two   three ") === 3);
check("x = 20 is not a leak of x = 2", !leaksAnswer("then x = 20", forbidden));
check("answer leak: x = 2", leaksAnswer("So x = 2 works", forbidden));
check("answer leak: Unicode minus and spacing do not hide it", leaksAnswer("(x − 2)(x − 3)", forbidden));
check(
  "leak hidden in next_question is caught",
  responseLeaks(
    {
      type: "hint",
      message: "ok",
      verdict: null,
      feedback_points: [],
      next_question: "Is x = 3 a solution?",
      hint_level: 1,
      flags: { unsupported_claim: false, reason: null },
    },
    forbidden
  )
);
check(
  "copy detection: verbatim copy",
  overlapRatio(
    "solving means finding the number that makes the equation true",
    "Solving means finding the number that makes the equation true."
  ) > 0.6
);
check(
  "copy detection: own words pass",
  overlapRatio("you look for the value that balances both sides", "Solving means finding the number that makes the equation true.") < 0.3
);
check(
  "JSON with fences and prose around it",
  parseJsonStrict('Here you go:\n```json\n{"type":"probe","message":"Hi?"}\n```')?.type === "probe"
);
check("JSON with an invalid type is rejected", parseJsonStrict('{"type":"nope","message":"x"}') === null);
check(
  "validator JSON parses follow_up",
  parseValidatorJson('{"verdict":"partial","covered":["a"],"missing":["b"],"follow_up":"Why?"}')?.follow_up === "Why?"
);
check("level goes up after a first-try pass", adjustLevel(1, "first_try")?.level === 2);
check("level never goes above 3", adjustLevel(3, "first_try") === null);
check("level goes down after a struggle", adjustLevel(3, "struggled")?.level === 2);

const step0 = lesson.steps[0];
check(
  "grader: full answer is understood",
  mockValidate(step0, 0, "x is the mystery number, solving means finding the number that makes both sides equal, and there can be two answers").verdict === "understood"
);
check(
  "grader: half answer is partial with a follow-up",
  (() => {
    const r = mockValidate(step0, 0, "x is the mystery number and solving means finding the number that makes the equation true");
    return r.verdict === "partial" && !!r.follow_up;
  })()
);
check(
  "grader: unrelated answer is missing",
  mockValidate(step0, 0, "I like football and pizza on fridays after school").verdict === "missing"
);

const tutor = (intent: "start" | "explain", input: string) =>
  mockTutor({
    lessonId: "quadratics",
    stepIndex: 0,
    attempt: 1,
    hintLevel: 1,
    level: null,
    history: [],
    studentInput: input,
    intent,
  }).response;
check("tutor: first reply is a probe, not an answer", tutor("start", "solve x² − 5x + 6 = 0").type === "probe");
check("tutor: unsure reply sets level 1", tutor("explain", "idk").student_level === 1);
check(
  "tutor: confident reply sets level 3",
  tutor("explain", "solving the equation means finding the roots where the unknown makes the product zero").student_level === 3
);
check(
  "tutor: no scripted message leaks the homework answer",
  (() => {
    const bad: string[] = [];
    for (let s = 0; s < lesson.steps.length; s++) {
      for (const lv of [1, 2, 3] as const) {
        const m = mockTutor({ lessonId: "quadratics", stepIndex: s, attempt: 1, hintLevel: 1, level: lv, history: [], studentInput: "ok fine yes", intent: "explain" }).response.message;
        if (leaksAnswer(m, forbidden)) bad.push(`explain step ${s} level ${lv}`);
        const r = mockTutor({ lessonId: "quadratics", stepIndex: s, attempt: 3, hintLevel: 1, level: lv, history: [], studentInput: "", intent: "reexplain" }).response.message;
        if (leaksAnswer(r, forbidden)) bad.push(`reexplain step ${s}`);
      }
      for (const h of [1, 2, 3]) {
        const m = mockTutor({ lessonId: "quadratics", stepIndex: s, attempt: 1, hintLevel: h, level: 1, history: [], studentInput: "", intent: "request_hint" }).response.message;
        if (leaksAnswer(m, forbidden)) bad.push(`hint step ${s} level ${h}`);
      }
    }
    if (bad.length) console.log("   leaks in:", bad.join(", "));
    return bad.length === 0;
  })()
);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
