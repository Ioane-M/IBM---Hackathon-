"use client";

export type StepState = "pending" | "active" | "understood" | "partial";

interface Props {
  labels: string[];
  states: StepState[];
  current: number;
}

/** Vertical map of the lesson steps: what the student has proven, not what they have read. */
export default function MasteryMap({ labels, states, current }: Props) {
  return (
    <ol className="relative flex flex-col gap-4">
      <span className="absolute left-[15px] top-4 bottom-4 w-[3px] bg-line" aria-hidden />
      {labels.map((label, i) => {
        const state = states[i] ?? "pending";
        const isCurrent = i === current && state !== "understood";
        const ring =
          state === "understood"
            ? "bg-ok border-ok text-white"
            : state === "partial"
            ? "bg-sun border-sun text-ink"
            : isCurrent
            ? "bg-brandsoft border-brand text-ink"
            : "bg-white border-line text-dim";
        return (
          <li key={label} className="relative flex items-center gap-3">
            <span
              className={`relative z-10 grid place-items-center w-8 h-8 rounded-full border-[3px] text-sm font-mono font-medium transition-colors ${ring}`}
            >
              {state === "understood" ? "✓" : i + 1}
            </span>
            <span className={`text-[15px] ${state === "pending" && !isCurrent ? "text-dim" : "text-ink font-semibold"}`}>
              {label}
            </span>
            {state === "partial" && (
              <span className="ml-auto text-[11px] font-mono uppercase tracking-wide text-amber-800 bg-sunsoft px-2 py-0.5 rounded-full">
                almost
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
