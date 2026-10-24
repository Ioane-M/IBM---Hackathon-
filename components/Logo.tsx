/** ProfLM mark: a speech bubble with a question mark, wearing a graduation cap. */
export function LogoMark({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 84" className={className} role="img" aria-label="ProfLM">
      <defs>
        <linearGradient id="proflm-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f7bff" />
          <stop offset="1" stopColor="#5b3df5" />
        </linearGradient>
      </defs>
      <path d="M24 26H56A16 16 0 0 1 72 42V56A16 16 0 0 1 56 72H38L24 82V72A16 16 0 0 1 8 56V42A16 16 0 0 1 24 26Z" fill="url(#proflm-lg)" />
      <path d="M20 22.5V33C20 39 60 39 60 33V22.5L40 30Z" fill="#e39b00" />
      <path d="M40 2L76 16L40 30L4 16Z" fill="#ffc21a" />
      <path d="M72 17V34" stroke="#ffc21a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="72" cy="37.5" r="3.6" fill="#ffc21a" />
      <path d="M31 51C31 42 49 42 49 51C49 57 40 57 40 63" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="69" r="3.3" fill="#fff" />
    </svg>
  );
}

export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-4xl" : "text-xl";
  const mark = size === "lg" ? "w-14 h-14" : "w-8 h-8";
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={mark} />
      <span className={`font-display font-extrabold tracking-tight text-ink ${text}`}>
        Prof<span className="text-brand">LM</span>
      </span>
    </span>
  );
}
