"use client";

import type { Material } from "@/lib/types";

interface Props {
  materials: Material[];
  activeId: string | null;
}

/** The teacher's files. The one the tutor is drawing on lights up. */
export default function MaterialsShelf({ materials, activeId }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      {materials.map((m) => (
        <div
          key={m.id}
          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
            activeId === m.id ? "bg-sunsoft border-sun translate-x-1" : "bg-white border-line"
          }`}
        >
          <span className="grid place-items-center w-7 h-9 rounded bg-brandsoft text-brand font-mono font-bold text-[9px]">
            {m.kind}
          </span>
          <span className="text-[15px] leading-tight">
            {m.title}
            <small className="block text-xs text-dim mt-0.5">{m.note}</small>
          </span>
        </div>
      ))}
      <p className="text-xs text-dim leading-snug mt-1">
        ProfLM teaches from these files. If something is not in them, it says so.
      </p>
    </div>
  );
}
