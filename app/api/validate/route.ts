import { NextRequest, NextResponse } from "next/server";
import { chat, isLive } from "@/lib/ica";
import { loadLesson, getStep } from "@/lib/lesson";
import { VALIDATOR_SYSTEM_PROMPT } from "@/lib/prompts";
import { clip, wordCount, overlapRatio, parseValidatorJson } from "@/lib/guards";
import { mockValidate } from "@/lib/mock";
import type { ValidateRequestBody, ValidatorResult } from "@/lib/types";

export const maxDuration = 60;

const MIN_WORDS = 15;
const COPY_THRESHOLD = 0.6;

export async function POST(req: NextRequest) {
  let body: ValidateRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body.stepIndex !== "number" || typeof body.studentAnswer !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const studentAnswer = clip(body.studentAnswer);
  const lastExplanation = clip(body.lastExplanation, 2000);
  const mode = isLive() ? "live" : "demo";

  // Guard: too short, no model call
  if (wordCount(studentAnswer) < MIN_WORDS) {
    const result: ValidatorResult = {
      verdict: "missing",
      covered: [],
      missing: [`Your answer was too short. Please write at least ${MIN_WORDS} words.`],
      unlocked: false,
    };
    return NextResponse.json({ ...result, reason: "too_short", mode });
  }

  // Guard: copied from the AI's text, no model call
  if (overlapRatio(studentAnswer, lastExplanation) > COPY_THRESHOLD) {
    const result: ValidatorResult = {
      verdict: "missing",
      covered: [],
      missing: ["Try saying it in your own words."],
      unlocked: false,
    };
    return NextResponse.json({ ...result, reason: "copied", mode });
  }

  // Load step rubric
  let step;
  try {
    const lesson = loadLesson(body.lessonId);
    step = getStep(lesson, body.stepIndex);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  // Demo mode: scripted grader
  if (!isLive()) {
    const { usage, ...graded } = mockValidate(step, body.stepIndex, studentAnswer);
    return NextResponse.json({ ...graded, unlocked: graded.verdict === "understood", usage, mode });
  }

  const validatorPrompt = `${VALIDATOR_SYSTEM_PROMPT}

Step concept: ${step.concept}
Rubric (required ideas):
${step.rubric.map((r: string, i: number) => `  ${i + 1}. ${r}`).join("\n")}

<student_answer>
${studentAnswer}
</student_answer>

Respond ONLY with this JSON, no extra text:
{ "verdict": "understood|partial|missing", "covered": ["..."], "missing": ["..."], "follow_up": "one short question or null" }`;

  let parsed: Omit<ValidatorResult, "unlocked"> | null = null;
  let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  try {
    const result = await chat({
      model: process.env.ICA_MODEL as string,
      messages: [{ role: "user", content: validatorPrompt }],
      temperature: 0.1,
      max_tokens: 350,
    });
    usage = result.usage;
    parsed = parseValidatorJson(result.text);
  } catch (err) {
    if (/Unauthorized|Forbidden|Bad Request|Too many/.test((err as Error).message)) {
      return NextResponse.json({ error: (err as Error).message }, { status: 502 });
    }
  }

  if (!parsed) {
    // Could not grade: let the student try again, never unlock by default
    return NextResponse.json({
      verdict: "partial",
      covered: [],
      missing: ["I had trouble checking that. Can you say it again in a different way?"],
      follow_up: null,
      unlocked: false,
      usage,
      mode,
    });
  }

  return NextResponse.json({ ...parsed, unlocked: parsed.verdict === "understood", usage, mode });
}
