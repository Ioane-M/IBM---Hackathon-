"use client";

interface Props {
  used: number;
  budget: number;
}

export default function TokenMeter({ used, budget }: Props) {
  const pct = Math.min(100, Math.round((used / budget) * 100));
  const remaining = Math.max(0, budget - used);
  const color = pct >= 90 ? "bg-bad" : pct >= 70 ? "bg-orange" : "bg-brand";

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-dim whitespace-nowrap">Tokens</span>
      <div className="w-24 h-2 bg-paper2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-dim whitespace-nowrap tabular-nums font-mono text-xs">
        {remaining.toLocaleString("en-US")} left
      </span>
    </div>
  );
}
