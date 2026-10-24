"use client";

import { useState } from "react";

/**
 * Interactive graph for a PRACTICE example (never the homework): y = x² + 3x + 2.
 * Drag the marker and find where the curve meets zero.
 */
const X0 = -5, X1 = 2, Y0 = -1, Y1 = 9;
const L = 36, R = 292, T = 8, B = 176;
const f = (x: number) => x * x + 3 * x + 2;
const px = (x: number) => L + ((x - X0) / (X1 - X0)) * (R - L);
const py = (y: number) => B - ((y - Y0) / (Y1 - Y0)) * (B - T);
const fmt = (n: number) => n.toFixed(2).replace("-", "−");

export default function ParabolaViz() {
  const [x, setX] = useState(-4.2);
  const [found, setFound] = useState<number[]>([]);

  let d = "";
  for (let v = -4.6; v <= 1.6; v += 0.1) d += `${d ? "L" : "M"}${px(v).toFixed(1)} ${py(f(v)).toFixed(1)}`;

  function onChange(v: number) {
    setX(v);
    for (const r of [-2, -1]) {
      if (Math.abs(v - r) < 0.05 && !found.includes(r)) setFound((p) => [...p, r]);
    }
  }

  const y = f(x);
  return (
    <div className="grid gap-2">
      <p className="text-[13px] text-dim leading-snug">
        Practice example <b className="font-mono text-ink">y = x² + 3x + 2</b>. Predict where the curve crosses
        <b className="font-mono text-ink"> y = 0</b>, then drag to check.
      </p>
      <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label="Parabola with a movable marker">
        <defs>
          <clipPath id="plot"><rect x={L} y={T} width={R - L} height={B - T} /></clipPath>
        </defs>
        {[-5, -4, -3, -2, -1, 0, 1, 2].map((g) => (
          <g key={g}>
            <line x1={px(g)} y1={T} x2={px(g)} y2={B} stroke="#e3eaf6" />
            <text x={px(g)} y={B + 13} textAnchor="middle" fontSize="9" fill="#55627d" fontFamily="monospace">
              {g < 0 ? `−${-g}` : g}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8].map((g) => (
          <g key={g}>
            <line x1={L} y1={py(g)} x2={R} y2={py(g)} stroke="#e3eaf6" />
            <text x={L - 5} y={py(g) + 3} textAnchor="end" fontSize="9" fill="#55627d" fontFamily="monospace">{g}</text>
          </g>
        ))}
        <line x1={L} y1={py(0)} x2={R} y2={py(0)} stroke="#111c33" strokeWidth="1.5" />
        <path d={d} fill="none" stroke="#0f62fe" strokeWidth="2.5" clipPath="url(#plot)" />
        {[-2, -1].map((r) => (
          <g key={r} opacity={found.includes(r) ? 1 : 0} style={{ transition: "opacity .3s" }}>
            <circle cx={px(r)} cy={py(0)} r="5.5" fill="#14a85f" />
            <text x={px(r)} y={py(0) - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0b7a43" fontFamily="monospace">
              x = {"−"}{-r}
            </text>
          </g>
        ))}
        <line x1={px(x)} y1={T} x2={px(x)} y2={B} stroke="#ff8a1f" strokeWidth="1.2" strokeDasharray="4 4" />
        <circle cx={px(x)} cy={py(Math.max(Y0, Math.min(Y1, y)))} r="5" fill="#ff8a1f" stroke="#fff" strokeWidth="1.5" />
      </svg>
      <input
        type="range"
        min={-4.4}
        max={1.4}
        step={0.01}
        value={x}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-brand"
        aria-label="x value"
      />
      <div className="font-mono text-xs text-ink">x = {fmt(x)} &nbsp; y = {fmt(y)}</div>
      <div className="text-sm font-semibold text-okdark min-h-[1.4em]">
        {found.length === 2
          ? "The curve meets zero at x = −2 and x = −1."
          : found.length === 1
          ? "One crossing found. Is there another?"
          : ""}
      </div>
    </div>
  );
}
