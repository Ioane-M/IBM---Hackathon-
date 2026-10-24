/**
 * Demo mode: scripted tutor and grader, used when ICA_API_KEY / ICA_MODEL are
 * not set. It follows the same rules as the live tutor (no final answers, levels,
 * rubric check) but the text is written in advance, not generated.
 * The UI shows a "demo mode" badge whenever this is active.
 */
import { clampLevel, LEVEL_STYLE } from "./levels";
import { wordCount } from "./guards";
import type {
  Level,
  Step,
  TutorRequestBody,
  TutorResponse,
  Usage,
  ValidatorResult,
} from "./types";

interface StepScript {
  probe: string;
  explain: Record<Level, string>;
  reexplain: string;
  hints: [string, string, string];
  rubric: RegExp[];
  followUps: string[];
}

const SCRIPT: StepScript[] = [
  {
    probe:
      "I won't solve this one for you, but I'll get you there. First: what do you think “solving” means here?",
    explain: {
      1: "Think of x as a mystery number. Solving means finding the number that makes the equation true. Example: in x² = 16, both 4 and −4 work, so a quadratic can have two answers. Now tell me in your own words: what does solving mean, and how many answers can there be?",
      2: "Solving means finding the values of x that make the equation true. A quadratic can have two solutions: in x² = 16, both x = 4 and x = −4 work. Explain it back in your own words.",
      3: "Solving = finding every x that satisfies the equation. A quadratic can have up to two roots (x² = 16 gives ±4). Explain that in your own words, then say how many roots x² − 25 = 0 has.",
    },
    reexplain:
      "Different angle: imagine a lock that opens with the right number. x is the number you are looking for, and “solving” is trying numbers until the lock opens. Some locks have two keys: in x² = 16, 4 and −4 both open it. Explain it back in your own words.",
    hints: [
      "What does the letter x stand for in an equation like this?",
      "Solving means finding every value of x that makes both sides equal.",
      "On a similar equation, x² − 25 = 0, both x = 5 and x = −5 work. How could two numbers both work?",
    ],
    rubric: [
      /unknown|mystery|variable|stands? for|number we (don'?t|do not) know|something we (don'?t|do not) know/i,
      /(find|finding|values?|numbers?).*(true|equal|works?|balance|satisf)|make[s]? (both sides|the equation) (true|equal)/i,
      /two (solutions?|answers?|numbers?|of them|values?)|both|plus.?minus|±|more than one|2 (solutions|answers)/i,
    ],
    followUps: [
      "What is the letter x standing in for?",
      "What has to be true about the number you find, when you put it back in the equation?",
      "Look at x² = 16. Is there only one number that works? Where could a second one come from?",
    ],
  },
  {
    probe:
      "Quick question before we start: if you multiply two numbers and the answer is 0, what must be true about at least one of them?",
    explain: {
      1: "If A × B = 0, one of them has to be zero, because anything times a non-zero number isn't zero. So (x − 1)(x − 4) = 0 means x − 1 = 0 or x − 4 = 0. It only works when the other side is exactly 0. Now explain it in your own words.",
      2: "Zero-product rule: if A × B = 0 then A = 0 or B = 0. For (x − 1)(x − 4) = 0, set each bracket to zero. It needs exactly 0 on the other side. Explain it back in your own words.",
      3: "Zero-product property: AB = 0 ⇒ A = 0 or B = 0, and only when the product is exactly 0. Explain why, then say what (x + 2)(x − 7) = 0 gives and why (x + 2)(x − 7) = 5 would not work the same way.",
    },
    reexplain:
      "Different angle: two doors in a row. To get a total of “nothing”, at least one door must be closed (zero). That is why A × B = 0 means A = 0 or B = 0. And it only works if the total is exactly nothing. Explain it back in your own words.",
    hints: [
      "If one of two numbers is 0, what is their product?",
      "This is called the zero-product rule: if A × B = 0 then A = 0 or B = 0.",
      "On (x + 2)(x − 7) = 0: set x + 2 = 0 and x − 7 = 0. What does each give?",
    ],
    rubric: [
      /(at least one|one of (them|the)|either|a factor|one factor|one bracket).*(zero|0)|(zero|0).*(one of|at least one|either)/i,
      /(other side|right side|equals?|equal to|has to be|must be|only works when|exactly).*(zero|0)|(zero|0).*(other side|right side|exactly)/i,
    ],
    followUps: [
      "If the product is zero, what can you say about the numbers being multiplied?",
      "Would the rule still work if the product were 5 instead of 0? Why or why not?",
    ],
  },
  {
    probe:
      "Two numbers multiply to 6 and add to 5. You don't need to say them yet: how would you go about looking for them?",
    explain: {
      1: "Picture two hidden numbers. Multiply them to get the last number. Add them to get the middle number. For x² + 3x + 2, try 1 and 2: 1 × 2 = 2 and 1 + 2 = 3, so it becomes (x + 1)(x + 2). Now explain how you'd find them.",
      2: "To factor x² + bx + c, find p and q with p × q = c and p + q = b. Example: x² + 3x + 2 → (x + 1)(x + 2). Explain the method in your own words.",
      3: "Find p, q with pq = c and p + q = b, then write (x + p)(x + q). Your turn: factor x² + 7x + 12 and explain why the check works.",
    },
    reexplain:
      "Different angle: it's like a secret code with two clues. Clue 1: the two numbers multiply to the last number. Clue 2: the same two numbers add to the middle number. When both clues fit, write them as (x + first)(x + second). Explain it back in your own words.",
    hints: [
      "What two things must be true about the pair of numbers you are looking for?",
      "Method: find p and q with p × q = c and p + q = b, then write (x + p)(x + q).",
      "On x² + 7x + 12: which pair multiplies to 12 and adds to 7? Try 3 and 4.",
    ],
    rubric: [
      /multipl\w*.*(last|constant|c\b|third)|product.*(last|constant|c\b)|times.*(last|constant)/i,
      /(add\w*|sum|plus).*(middle|b\b|coefficient|second)|(middle).*(add|sum|plus)/i,
      /\(x ?[+−-] ?\w+\) ?\(x|brackets?|parenthes|write (it )?as|two (factors|brackets)/i,
    ],
    followUps: [
      "Which of the three numbers in the equation does the product have to match?",
      "And what does the sum of the two numbers have to match?",
      "Once you have the two numbers, how do you write the expression?",
    ],
  },
  {
    probe:
      "Last step. Suppose you have x² + 5x + 4 = 0 (a practice one, not your homework). In what order would you do things?",
    explain: {
      1: "Do it in order: 1) factor, 2) set each bracket to zero, 3) check by putting the answer back in. Example: x² + 3x + 2 = 0 → (x + 1)(x + 2) = 0 → x = −1 or x = −2. Check x = −1: 1 − 3 + 2 = 0 ✓. Explain the order in your own words.",
      2: "Factor, apply the zero-product rule, then check each solution in the original equation. Example: x² + 3x + 2 = 0 → x = −1 or −2; check x = −1: 1 − 3 + 2 = 0. Explain the process in your own words.",
      3: "Factor, apply zero-product, verify by substitution. Try x² + 5x + 4 = 0 and show your check, then say why checking matters.",
    },
    reexplain:
      "Different angle: think of it as build, split, test. Build the brackets, split into two small equations, test each answer in the original. Explain it back in your own words.",
    hints: [
      "What is the first thing you do to the expression?",
      "Factor, then use the zero-product rule, then check.",
      "On x² + 5x + 4: which two numbers multiply to 4 and add to 5?",
    ],
    rubric: [
      /factor\w*.*(zero|0|each|set)|(zero|0).*(factor)|zero.?product/i,
      /check|substitut|put (it|them|the answer) back|plug|verify/i,
    ],
    followUps: [
      "After you factor, what do you do with the two brackets?",
      "How can you be sure your answers are right?",
    ],
  },
];

// ── helpers ────────────────────────────────────────────────────────────────

function tokensFor(inText: string, outText: string): Usage {
  const p = Math.round(wordCount(inText) * 1.6) + 220;
  const c = Math.round(wordCount(outText) * 1.6) + 20;
  return { prompt_tokens: p, completion_tokens: c, total_tokens: p + c };
}

function detectLevel(reply: string): { level: Level; reason: string } {
  const words = wordCount(reply);
  const unsure = /\b(idk|dont know|don't know|not sure|no idea|dunno)\b|\?\s*$/i.test(reply);
  const terms = (reply.match(/\b(equation|solv\w*|factor\w*|unknown|variable|roots?|zero|product|multipl\w*|solutions?|bracket\w*)\b/gi) ?? []).length;

  if (words <= 5 || unsure) {
    return {
      level: 1,
      reason: "Short, unsure answer with no terms, so: simple words, an analogy, small steps.",
    };
  }
  if (words >= 12 && terms >= 2) {
    return {
      level: 3,
      reason: "A confident answer with the right terms, so: precise wording and a challenge.",
    };
  }
  return {
    level: 2,
    reason: "You know part of it, so: precise terms with a short explanation.",
  };
}

function base(type: TutorResponse["type"], message: string): TutorResponse {
  return {
    type,
    message,
    verdict: null,
    feedback_points: [],
    next_question: null,
    hint_level: 0,
    flags: { unsupported_claim: false, reason: null },
    student_level: null,
    level_reason: null,
  };
}

// ── scripted tutor ─────────────────────────────────────────────────────────

export function mockTutor(
  body: TutorRequestBody
): { response: TutorResponse; usage: Usage } {
  const s = SCRIPT[Math.min(Math.max(body.stepIndex, 0), SCRIPT.length - 1)];
  const input = body.studentInput ?? "";
  let response: TutorResponse;

  switch (body.intent) {
    case "start":
      response = base("probe", s.probe);
      break;

    case "explain": {
      const known = clampLevel(body.level);
      const det = detectLevel(input);
      const level = known ?? det.level;
      response = base("explain", s.explain[level]);
      response.student_level = level;
      response.level_reason = known
        ? `Level kept: ${LEVEL_STYLE[level]}.`
        : det.reason;
      break;
    }

    case "reexplain":
      response = base("explain", s.reexplain);
      response.student_level = clampLevel(body.level);
      break;

    case "request_hint": {
      const lv = Math.min(3, Math.max(1, body.hintLevel || 1));
      response = base("hint", `Hint ${lv}: ${s.hints[lv - 1]}`);
      response.hint_level = lv;
      break;
    }

    default:
      response = base(
        "refuse",
        "I can't give you the answer directly, because that would skip the part where you learn it. Let's use a hint instead. What do you think the first step is?"
      );
  }

  return { response, usage: tokensFor(input + body.history.map((h) => h.content).join(" "), response.message) };
}

// ── scripted grader ────────────────────────────────────────────────────────

export function mockValidate(
  step: Step,
  stepIndex: number,
  answer: string
): Omit<ValidatorResult, "unlocked"> & { usage: Usage } {
  const s = SCRIPT[Math.min(Math.max(stepIndex, 0), SCRIPT.length - 1)];
  const covered: string[] = [];
  const missing: string[] = [];
  let firstMissing = -1;

  step.rubric.forEach((idea, i) => {
    const re = s.rubric[i];
    if (re && re.test(answer)) covered.push(idea);
    else {
      missing.push(idea);
      if (firstMissing === -1) firstMissing = i;
    }
  });

  const verdict: ValidatorResult["verdict"] =
    missing.length === 0 ? "understood" : covered.length === 0 ? "missing" : "partial";

  return {
    verdict,
    covered,
    missing,
    follow_up: verdict === "understood" ? null : s.followUps[Math.max(0, firstMissing)] ?? null,
    usage: tokensFor(answer, covered.join(" ") + missing.join(" ")),
  };
}
