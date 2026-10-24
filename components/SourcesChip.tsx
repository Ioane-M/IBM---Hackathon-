"use client";

interface Source {
  name?: string;
  text?: string;
  [key: string]: unknown;
}

interface Props {
  sources: Source[];
}

/** Sources returned by ICA when a document collection is attached. */
export default function SourcesChip({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {sources.map((s, i) => {
        const label = s.name ?? s.text?.slice(0, 60) ?? `Source ${i + 1}`;
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-xs font-mono bg-brandsoft text-brand px-2.5 py-1 rounded-md"
            title={s.text ?? s.name ?? ""}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
