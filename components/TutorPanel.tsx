"use client";

import SourcesChip from "./SourcesChip";
import { LogoMark } from "./Logo";

export interface Source {
  name?: string;
  text?: string;
  [key: string]: unknown;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  label?: string;
  /** Lines under the message: ✓ right, → next question */
  points?: Array<{ kind: "ok" | "part" | "ask"; text: string }>;
  verdict?: "understood" | "partial" | "missing" | null;
  sources?: Source[];
  /** Where this explanation comes from in the teacher's files, e.g. "Chapter 5 notes · p. 2" */
  ref?: string;
}

interface Props {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

const VERDICT = {
  understood: { text: "Understood · next step unlocked", cls: "bg-ok text-white" },
  partial: { text: "Partly there · step stays locked", cls: "bg-sun text-ink" },
  missing: { text: "Not yet · step stays locked", cls: "bg-badsoft text-bad" },
} as const;

export default function TutorPanel({ messages, loading, error }: Props) {
  return (
    <div className="flex flex-col gap-3.5">
      {messages.length === 0 && !loading && (
        <p className="text-dim text-[15px]">
          Type your homework problem below to begin. ProfLM will ask you a question first.
        </p>
      )}

      {messages.map((msg, i) => (
        <div key={i} className={`rise flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
          {msg.role === "assistant" && <LogoMark className="w-7 h-8 shrink-0 mt-1" />}

          <div className={`max-w-[88%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`rounded-2xl px-4 py-3 text-[16px] leading-snug whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-sunsoft border border-sun"
                  : "bg-paper border border-line"
              }`}
            >
              {msg.label && (
                <span className="block font-mono text-[11px] uppercase tracking-widest text-brand mb-1">
                  {msg.label}
                </span>
              )}
              {msg.content}

              {msg.points && msg.points.length > 0 && (
                <ul className="mt-2 grid gap-1 text-[15px]">
                  {msg.points.map((p, j) => (
                    <li
                      key={j}
                      className={p.kind === "ok" ? "text-okdark" : p.kind === "part" ? "text-amber-800" : "text-ink font-semibold"}
                    >
                      {p.kind === "ok" ? "✓ " : p.kind === "part" ? "~ " : ""}
                      {p.text}
                    </li>
                  ))}
                </ul>
              )}

              {msg.ref && (
                <span className="inline-block mt-2 font-mono text-xs bg-brandsoft text-brand px-2 py-0.5 rounded-md">
                  {msg.ref}
                </span>
              )}

              {msg.verdict && (
                <span className={`block w-fit mt-2 font-mono text-xs uppercase tracking-wide px-2.5 py-1 rounded-full ${VERDICT[msg.verdict].cls}`}>
                  {VERDICT[msg.verdict].text}
                </span>
              )}
            </div>
            {msg.sources && msg.sources.length > 0 && <SourcesChip sources={msg.sources} />}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex gap-3">
          <LogoMark className="w-7 h-8 shrink-0 mt-1" />
          <div className="bg-paper border border-line rounded-2xl px-4 py-3.5">
            <span className="inline-flex gap-1.5" aria-label="ProfLM is thinking">
              <span className="w-2 h-2 bg-dim rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-dim rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-dim rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="text-sm text-bad bg-badsoft border border-bad/40 rounded-xl px-4 py-3">
          Something went wrong: {error}. Please try again.
        </div>
      )}
    </div>
  );
}
