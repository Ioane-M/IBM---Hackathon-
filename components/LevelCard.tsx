"use client";

import type { Level } from "@/lib/types";
import { LEVEL_NAMES, LEVEL_STYLE } from "@/lib/levels";

interface Props {
  level: Level | null;
  reason: string | null;
}

export default function LevelCard({ level, reason }: Props) {
  return (
    <div className="grid gap-2">
      <div className="font-display font-extrabold text-xl">
        {level ? LEVEL_NAMES[level] : "Not known yet"}
      </div>
      <div className="grid grid-cols-3 gap-1.5" aria-hidden>
        {[1, 2, 3].map((n) => (
          <i key={n} className={`h-2 rounded-full transition-colors ${level && n <= level ? "bg-brand" : "bg-paper2"}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-dim">
        <span>Starting</span>
        <span>Building</span>
        <span>Confident</span>
      </div>
      <p className="text-[13.5px] leading-snug text-dim min-h-[3.6em]">
        {reason ?? "ProfLM starts with a question to find out where you are."}
      </p>
      <span className="font-mono text-xs bg-brandsoft text-brand px-2.5 py-1.5 rounded-md w-fit">
        Explaining: {level ? LEVEL_STYLE[level] : "not set"}
      </span>
    </div>
  );
}
