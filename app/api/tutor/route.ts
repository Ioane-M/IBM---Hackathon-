import { NextRequest, NextResponse } from "next/server";
import { chat, isLive } from "@/lib/ica";
import type { ChatMessage } from "@/lib/ica";
import { loadLesson, getStep } from "@/lib/lesson";
import { buildContextBlock, TUTOR_SYSTEM_PROMPT } from "@/lib/prompts";
import { clip, parseJsonStrict, responseLeaks, wordCount } from "@/lib/guards";
import { clampLevel } from "@/lib/levels";
import { mockTutor } from "@/lib/mock";
import type { TutorRequestBody, TutorResponse, Usage } from "@/lib/types";

export const maxDuration = 60;

const INTENTS = ["start", "explain", "reexplain", "request_hint", "request_answer"];

// Fixed redirect for "just give me the answer": never calls the model.
const ANSWER_REDIRECT: TutorResponse = {
  type: "refuse",
  message:
    "I can't give you the answer directly, because that would skip the part where you actually learn it. Let's use a hint instead. What do you think the first step should be?",
  verdict: null,
  feedback_points: [],
  next_question: "What do you think the first step should be?",
  hint_level: 1,
  flags: { unsupported_claim: false, reason: null },
};

const SAFE_HINT: TutorResponse = {
  ...ANSWER_REDIRECT,
  message:
    "Let's think about this differently. What do you already know about solving equations? What are we actually trying to find?",
};

const FALLBACK_RESPONSE: TutorResponse = {
  ...ANSWER_REDIRECT,
  message: "I didn't catch that. Could you say it again in a different way?",
  next_question: null,
  hint_level: 0,
};

const zeroUsage = (): Usage => ({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });

export async function POST(req: NextRequest) {
  let body: TutorRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || !INTENTS.includes(body.intent) || typeof body.stepIndex !== "number") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const intent = body.intent;
  const attempt = Number.isFinite(body.attempt) ? body.attempt : 1;
  const hintLevel = Math.min(3, Math.max(1, Math.round(body.hintLevel || 1)));
  const level = clampLevel(body.level);
  const studentInput = clip(body.studentInput);

  // Never call the model for answer requests
  if (intent === "request_answer") {
    return NextResponse.json({ response: ANSWER_REDIRECT, usage: null, mode: isLive() ? "live" : "demo" });
  }

  // Load lesson + step
  let lesson, step;
  try {
    lesson = loadLesson(body.lessonId);
    step = getStep(lesson, body.stepIndex);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  // Demo mode: scripted tutor
  if (!isLive()) {
    const { response, usage } = mockTutor({ ...body, level, hintLevel, studentInput });
    return NextResponse.json({ response, usage, sources: [], mode: "demo" });
  }

  const model = process.env.ICA_MODEL as string;
  const contextBlock = buildContextBlock(step, intent, attempt, hintLevel, level);

  // Last 6 turns, both roles, each clipped. The model needs to see its own earlier replies.
  const history: ChatMessage[] = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-6)
    .map((m) => ({ role: m.role, content: clip(m.content, 600) }));

  const messages: ChatMessage[] = [
    { role: "system", content: TUTOR_SYSTEM_PROMPT + "\n\n" + contextBlock },
    ...history,
    ...(studentInput ? [{ role: "user" as const, content: studentInput }] : []),
  ];

  const usage = zeroUsage();
  let sources: unknown[] = [];

  async function call(extra?: string): Promise<TutorResponse | null> {
    const msgs = extra ? [...messages, { role: "user" as const, content: extra }] : messages;
    try {
      const collection = process.env.ICA_COLLECTION_ID;
      const result = await chat({
        model,
        messages: msgs,
        temperature: 0.3,
        max_tokens: 500,
        files: collection ? [{ type: "collection", id: collection }] : undefined,
      });
      usage.prompt_tokens += result.usage.prompt_tokens;
      usage.completion_tokens += result.usage.completion_tokens;
      usage.total_tokens += result.usage.total_tokens;
      if (result.sources?.length) sources = result.sources;
      return parseJsonStrict(result.text);
    } catch (err) {
      if (/Unauthorized|Forbidden|Bad Request|Too many/.test((err as Error).message)) throw err;
      return null;
    }
  }

  try {
    let response = (await call()) ?? (await call("Your last reply was not valid JSON. Reply with ONLY the JSON object."));
    if (!response) return NextResponse.json({ response: FALLBACK_RESPONSE, usage, sources, mode: "live" });

    // Guard: explanations over 80 words get one retry
    if (response.type === "explain" && wordCount(response.message) > 80) {
      const shorter = await call("Your explanation was too long. Rewrite it in 80 words or fewer. Reply with ONLY the JSON object.");
      if (shorter) response = shorter;
    }

    // Guard: the homework answer must never appear in anything the student sees
    const forbidden = lesson.homeworkProblem.forbiddenAnswerPatterns;
    if (responseLeaks(response, forbidden)) {
      const safe = await call(
        "WARNING: your previous reply contained the homework answer. Rewrite it without revealing the solutions or any equivalent. Use only the similar problem for worked examples. Reply with ONLY the JSON object."
      );
      response = safe && !responseLeaks(safe, forbidden) ? safe : SAFE_HINT;
    }

    return NextResponse.json({ response, usage, sources, mode: "live" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
