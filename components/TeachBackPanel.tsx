"use client";

import { useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
  loading?: boolean;
}

const MIN_WORDS = 15;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * The explain-back box. Docked above the input so the feedback above it stays
 * readable. The next step stays locked until this is answered well enough.
 */
export default function TeachBackPanel({ onSubmit, loading = false }: Props) {
  const [value, setValue] = useState("");
  const words = countWords(value);
  const ready = words >= MIN_WORDS && !loading;

  function submit() {
    if (!ready) return;
    onSubmit(value.trim());
    setValue("");
  }

  return (
    <div className="rise border-t-4 border-brand bg-white px-5 py-4 grid gap-2.5 shadow-[0_-12px_30px_-18px_#0f62fe66]">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-display font-extrabold text-lg">Explain it back</h2>
        <span className="text-sm text-dim">In your own words. At least {MIN_WORDS} words. Rough words are fine.</span>
      </div>
      <textarea
        className="w-full bg-paper border border-line rounded-xl p-3 text-[16px] resize-none outline-none focus:border-brand min-h-[84px] placeholder:text-[#8190ab] disabled:opacity-60"
        placeholder="Explain it like you're telling a friend."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        disabled={loading}
        aria-label="Your explanation"
        autoFocus
      />
      <div className="flex items-center justify-between gap-3">
        <span className={`font-mono text-xs tabular-nums ${words >= MIN_WORDS ? "text-okdark" : "text-dim"}`}>
          {words} / {MIN_WORDS} words
        </span>
        <button
          onClick={submit}
          disabled={!ready}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-brand text-white hover:bg-blue-700 disabled:bg-paper2 disabled:text-dim disabled:cursor-not-allowed"
        >
          {loading ? "Checking…" : "Check my explanation"}
        </button>
      </div>
    </div>
  );
}
