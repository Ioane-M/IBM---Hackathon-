"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import lessonData from "@/lessons/quadratics.json";
import Logo from "@/components/Logo";
import TutorPanel from "@/components/TutorPanel";
import type { Message } from "@/components/TutorPanel";
import TeachBackPanel from "@/components/TeachBackPanel";
import MasteryMap from "@/components/MasteryMap";
import type { StepState } from "@/components/MasteryMap";
import LevelCard from "@/components/LevelCard";
import MaterialsShelf from "@/components/MaterialsShelf";
import ParabolaViz from "@/components/ParabolaViz";
import TokenMeter from "@/components/TokenMeter";
import { adjustLevel } from "@/lib/levels";
import type { Lesson, Level, TutorIntent, TutorResponse } from "@/lib/types";

const lesson = lessonData as unknown as Lesson;
const LESSON_ID = "quadratics";
const TOKEN_BUDGET = 20_000;
const STEPS = lesson.steps;
const MATERIALS = lesson.materials ?? [];

type Phase = "intro" | "probe" | "teachback" | "ready" | "done";
type Mode = "live" | "demo" | null;

const LEVEL_LABEL: Record<Level, string> = {
  1: "Explain · simple words",
  2: "Explain · precise terms",
  3: "Explain · challenge",
};

export default function LessonPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [tbLoading, setTbLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [stepStates, setStepStates] = useState<StepState[]>(Array(STEPS.length).fill("pending"));
  const [hintLevel, setHintLevel] = useState(0);

  const [level, setLevelState] = useState<Level | null>(null);
  const [levelReason, setLevelReason] = useState<string | null>(null);
  const [tokens, setTokens] = useState(0);
  const [mode, setMode] = useState<Mode>(null);
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);

  // Refs hold the values the async handlers read, so they never see stale state.
  const messagesRef = useRef<Message[]>([]);
  const levelRef = useRef<Level | null>(null);
  const attemptRef = useRef(1);
  const hintRef = useRef(0);
  const hintsUsedRef = useRef(0);
  const lastExplanation = useRef("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setMode(d.mode === "live" ? "live" : "demo"))
      .catch(() => setMode(null));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, phase]);

  // ── helpers ──────────────────────────────────────────────────────────────

  function push(msg: Message) {
    messagesRef.current = [...messagesRef.current, msg];
    setMessages(messagesRef.current);
  }

  function setState(idx: number, state: StepState) {
    setStepStates((prev) => prev.map((s, i) => (i === idx ? state : s)));
  }

  function setLevel(l: Level, reason: string | null) {
    levelRef.current = l;
    setLevelState(l);
    setLevelReason(reason);
  }

  function addUsage(usage?: { total_tokens?: number } | null) {
    if (usage?.total_tokens) setTokens((t) => t + usage.total_tokens!);
  }

  // ── tutor call ───────────────────────────────────────────────────────────

  async function ask(opts: {
    intent: TutorIntent;
    step: number;
    studentInput?: string;
    hint?: number;
  }): Promise<TutorResponse | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: LESSON_ID,
          stepIndex: opts.step,
          attempt: attemptRef.current,
          hintLevel: opts.hint ?? 1,
          level: levelRef.current,
          history: messagesRef.current.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          studentInput: opts.studentInput ?? "",
          intent: opts.intent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");

      if (data.mode) setMode(data.mode);
      addUsage(data.usage);

      const r: TutorResponse = data.response;

      // The tutor judges the level once, after the first probe answer.
      if (r.student_level && levelRef.current === null) {
        setLevel(r.student_level, r.level_reason ?? null);
      }

      const sref = STEPS[opts.step]?.sourceRef;
      const material = MATERIALS.find((m) => m.id === sref?.materialId);
      const isExplain = r.type === "explain";

      let label = "ProfLM";
      if (r.type === "probe") label = "Probe";
      else if (r.type === "hint") label = "Hint";
      else if (isExplain) label = levelRef.current ? LEVEL_LABEL[levelRef.current] : "Explain";

      push({
        role: "assistant",
        content: r.message,
        label,
        sources: data.sources ?? [],
        ref: isExplain && material && sref ? `${material.title} · ${sref.where}` : undefined,
      });

      if (isExplain) {
        lastExplanation.current = r.message;
        setActiveMaterial(material?.id ?? null);
        setPhase("teachback");
      } else if (r.type === "probe") {
        setPhase("probe");
      }
      return r;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  // ── student sends a message ──────────────────────────────────────────────

  async function onSend() {
    const text = input.trim();
    if (!text || loading) return;

    if (phase === "intro") {
      setInput("");
      push({ role: "user", content: text });
      setState(0, "active");
      attemptRef.current = 1;
      await ask({ intent: "start", step: 0, studentInput: text });
    } else if (phase === "probe") {
      setInput("");
      push({ role: "user", content: text });
      await ask({ intent: "explain", step: stepIndex, studentInput: text });
    }
  }

  // ── explain-back submitted ───────────────────────────────────────────────

  async function onTeachBack(answer: string) {
    setTbLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: LESSON_ID,
          stepIndex,
          attempt: attemptRef.current,
          studentAnswer: answer,
          lastExplanation: lastExplanation.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");

      if (data.mode) setMode(data.mode);
      addUsage(data.usage);
      push({ role: "user", content: answer });

      if (data.reason === "too_short") {
        push({
          role: "assistant",
          label: "Check",
          content: "That's a bit short. I need at least 15 words to tell whether it clicked. Give it another go.",
        });
        return;
      }
      if (data.reason === "copied") {
        push({
          role: "assistant",
          label: "Check",
          content: "That sounds a lot like my own words coming back. Try saying it your way. Rough words are fine.",
        });
        return;
      }

      const verdict = data.verdict as "understood" | "partial" | "missing";
      const covered: string[] = data.covered ?? [];
      const points: NonNullable<Message["points"]> = covered.map((c) => ({ kind: "ok" as const, text: c }));
      if (verdict !== "understood" && data.follow_up) points.push({ kind: "ask", text: data.follow_up });

      push({
        role: "assistant",
        label: "Feedback",
        content:
          verdict === "understood"
            ? "Nice. You've got it."
            : verdict === "partial"
            ? "You're close. Here's what you already have:"
            : "Not quite yet. Let's look at it again.",
        points,
        verdict,
      });

      if (verdict === "understood") {
        setState(stepIndex, "understood");
        if (attemptRef.current === 1 && hintsUsedRef.current === 0) {
          const adj = adjustLevel(levelRef.current, "first_try");
          if (adj) setLevel(adj.level, adj.reason);
        }
        if (stepIndex < STEPS.length - 1) {
          setPhase("ready");
        } else {
          push({
            role: "assistant",
            label: "Done",
            content: "You've been through all four steps and explained each one yourself. That's how it sticks. Well done.",
          });
          setPhase("done");
        }
      } else {
        setState(stepIndex, verdict === "partial" ? "partial" : "active");
        attemptRef.current += 1;
        if (attemptRef.current >= 3) {
          // Two tries without it: change the angle and the level of the explanation.
          const adj = adjustLevel(levelRef.current, "struggled");
          if (adj) setLevel(adj.level, adj.reason);
          await ask({ intent: "reexplain", step: stepIndex });
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTbLoading(false);
    }
  }

  // ── next step, hints, answer requests ────────────────────────────────────

  async function goNext() {
    const next = stepIndex + 1;
    setStepIndex(next);
    attemptRef.current = 1;
    hintRef.current = 0;
    hintsUsedRef.current = 0;
    setHintLevel(0);
    setState(next, "active");
    await ask({ intent: "start", step: next });
  }

  async function onHint() {
    if (loading || hintRef.current >= 3) return;
    const lv = hintRef.current + 1;
    hintRef.current = lv;
    hintsUsedRef.current += 1;
    setHintLevel(lv);
    await ask({ intent: "request_hint", step: stepIndex, hint: lv });
  }

  async function onRequestAnswer() {
    if (loading) return;
    push({ role: "user", content: "Just give me the answer." });
    await ask({ intent: "request_answer", step: stepIndex, studentInput: "Just give me the answer." });
  }

  // ── render ───────────────────────────────────────────────────────────────

  const canType = (phase === "intro" || phase === "probe") && !loading;
  const inLesson = phase === "probe" || phase === "teachback";

  return (
    <div className="min-h-dvh lg:h-dvh flex flex-col bg-white">
      <header className="border-b border-line bg-paper px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <Logo />
          <span className="text-dim text-sm hidden sm:block">Maths 9 · Quadratic equations</span>
          {mode === "demo" && (
            <span
              className="text-xs font-mono uppercase tracking-wide bg-sun text-ink px-2.5 py-1 rounded-full"
              title="No API key is set, so the tutor and grader are scripted. Set ICA_API_KEY and ICA_MODEL to go live."
            >
              Demo mode · scripted tutor
            </span>
          )}
          {mode === "live" && (
            <span className="text-xs font-mono uppercase tracking-wide bg-oksoft text-okdark px-2.5 py-1 rounded-full">
              Live · IBM Consulting Advantage
            </span>
          )}
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <TokenMeter used={tokens} budget={TOKEN_BUDGET} />
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/teacher" className="text-brand hover:underline">Teacher view</Link>
            <a href="/pitch" className="text-brand hover:underline">Presentation</a>
          </nav>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* Left: class materials + mastery map */}
        <aside className="border-b lg:border-b-0 lg:border-r border-line bg-paper/60 p-5 flex flex-col gap-6 lg:overflow-y-auto">
          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-dim mb-3">Class materials</h2>
            <MaterialsShelf materials={MATERIALS} activeId={activeMaterial} />
          </section>
          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-dim mb-3">Mastery map</h2>
            <MasteryMap labels={STEPS.map((s) => s.label)} states={stepStates} current={stepIndex} />
          </section>
        </aside>

        {/* Centre: conversation */}
        <main className="flex flex-col min-h-[60vh] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-line">
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <TutorPanel messages={messages} loading={loading} error={error} />
            <div ref={endRef} />
          </div>

          {phase === "ready" && (
            <div className="border-t border-ok bg-oksoft px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-semibold text-okdark">
                Step {stepIndex + 1} understood. Step {stepIndex + 2} is unlocked.
              </span>
              <button
                onClick={goNext}
                disabled={loading}
                className="px-4 py-2 bg-ok hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Next step →
              </button>
            </div>
          )}

          {phase === "teachback" && <TeachBackPanel onSubmit={onTeachBack} loading={tbLoading || loading} />}

          {(phase === "intro" || phase === "probe") && (
            <div className="border-t border-line bg-paper px-5 py-4 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                placeholder={
                  phase === "intro"
                    ? "Type your homework problem to begin (for example: solve x² − 5x + 6 = 0)"
                    : "Answer the question in your own words…"
                }
                disabled={!canType}
                aria-label="Your message"
                className="flex-1 bg-white border border-line rounded-xl px-4 py-2.5 text-[16px] outline-none focus:border-brand disabled:opacity-60"
              />
              <button
                onClick={onSend}
                disabled={!canType || !input.trim()}
                className="px-5 py-2.5 bg-brand hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:bg-paper2 disabled:text-dim disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          )}
        </main>

        {/* Right: level, homework, hints, graph */}
        <aside className="p-5 flex flex-col gap-6 lg:overflow-y-auto">
          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-dim mb-3">Your level</h2>
            <LevelCard level={level} reason={levelReason} />
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-dim mb-2">Your homework</h2>
            <div className="bg-paper border border-line rounded-xl px-4 py-3 font-mono text-base">
              {lesson.homeworkProblem.text}
            </div>
            <p className="text-xs text-dim mt-2 leading-snug">
              ProfLM will work through it with you. It will not give you the answer.
            </p>
          </section>

          {inLesson && (
            <section className="grid gap-2">
              <button
                onClick={onHint}
                disabled={loading || hintLevel >= 3}
                className="w-full px-4 py-2 text-sm font-semibold bg-sunsoft hover:bg-sun/60 border border-sun text-ink rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hintLevel >= 3 ? "No more hints. Try it your way." : `Get a hint (${hintLevel + 1} of 3)`}
              </button>
              <button
                onClick={onRequestAnswer}
                disabled={loading}
                className="w-full px-4 py-2 text-sm text-dim hover:text-ink border border-line hover:bg-paper rounded-xl transition-colors disabled:opacity-50"
              >
                Just give me the answer
              </button>
            </section>
          )}

          {stepIndex >= 1 && (
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-dim mb-2">Try it</h2>
              <ParabolaViz />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
