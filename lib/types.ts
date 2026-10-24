// ── Lesson data types ──────────────────────────────────────────────────────

export interface HomeworkProblem {
  text: string;
  forbiddenAnswerPatterns: string[];
}

export interface Material {
  id: string;
  title: string;
  kind: "PDF" | "PPT";
  note: string;
}

export interface SourceRef {
  materialId: string;
  where: string;
}

export interface Step {
  id: number;
  label: string;
  concept: string;
  rubric: string[];
  miniExample: string;
  similarProblem: string;
  sourceRef?: SourceRef;
}

export interface Lesson {
  id: string;
  subject: string;
  grade: number;
  topic: string;
  homeworkProblem: HomeworkProblem;
  materials?: Material[];
  steps: Step[];
}

// ── Student level (personalisation) ────────────────────────────────────────

/** 1 = starting out, 2 = building, 3 = confident */
export type Level = 1 | 2 | 3;

// ── Tutor API contract ─────────────────────────────────────────────────────

export type TutorResponseType =
  | "probe"
  | "explain"
  | "teach_back"
  | "validate"
  | "hint"
  | "refuse";

export type Verdict = "understood" | "partial" | "missing" | null;

export interface TutorResponse {
  type: TutorResponseType;
  message: string;
  verdict: Verdict;
  feedback_points: string[];
  next_question: string | null;
  hint_level: number;
  flags: {
    unsupported_claim: boolean;
    reason: string | null;
  };
  /** Set by the tutor after the probe: how the student seems to be doing. */
  student_level?: Level | null;
  /** One short sentence the student can read: why this level. */
  level_reason?: string | null;
}

// ── Validator result ───────────────────────────────────────────────────────

export interface ValidatorResult {
  verdict: "understood" | "partial" | "missing";
  covered: string[];
  missing: string[];
  /** One short question that nudges toward the missing idea without stating it. */
  follow_up?: string | null;
  unlocked: boolean;
}

// ── API route payloads ─────────────────────────────────────────────────────

export type TutorIntent =
  | "start" // ask a probe question
  | "explain" // student answered the probe: judge level, explain at that level
  | "reexplain" // student struggled: explain a different way
  | "request_hint"
  | "request_answer";

export interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface TutorRequestBody {
  lessonId: string;
  stepIndex: number;
  attempt: number;
  /** For request_hint: the hint level to give (1 to 3). */
  hintLevel: number;
  level: Level | null;
  history: HistoryItem[];
  studentInput: string;
  intent: TutorIntent;
}

export interface ValidateRequestBody {
  lessonId: string;
  stepIndex: number;
  attempt: number;
  studentAnswer: string;
  lastExplanation: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
