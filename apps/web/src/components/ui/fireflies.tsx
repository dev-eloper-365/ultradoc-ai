"use client";

import { useMemo } from "react";

// Ported from a Sass @for-loop demo (each firefly got its own uniquely
// generated @keyframes). CSS can't generate keyframes per-instance at
// runtime, so instead every firefly shares ONE @keyframes (see .firefly in
// globals.css) and gets its own random path baked in as CSS custom
// properties (--fx0.."STEPS", --fy*, --fs*) via inline style — same visual
// result, no per-element stylesheet rules.
const QUANTITY = 26;
const STEPS = 16; // keyframe in globals.css has STEPS+1 stops (0%..100%)

// Deterministic per-firefly jitter: same value on server and client render,
// so fireflies don't get a Math.random() hydration mismatch (same technique
// as background-beams.tsx).
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function Fireflies({ className = "" }: { className?: string }) {
  const fireflies = useMemo(() => {
    return Array.from({ length: QUANTITY }, (_, i) => {
      const style: Record<string, string> = {};
      for (let step = 0; step <= STEPS; step++) {
        const seed = i * 1000 + step * 7;
        style[`--fx${step}`] = `${(seededRandom(seed) * 100 - 50).toFixed(2)}vw`;
        style[`--fy${step}`] = `${(seededRandom(seed + 3) * 100 - 50).toFixed(2)}vh`;
        style[`--fs${step}`] = (seededRandom(seed + 5) * 0.75 + 0.25).toFixed(2);
      }
      style["--fdrift-duration"] = `${(seededRandom(i * 13 + 1) * 10 + 8).toFixed(2)}s`;
      style["--fflash-duration"] = `${Math.round(seededRandom(i * 17 + 2) * 6000 + 5000)}ms`;
      style["--fflash-delay"] = `${Math.round(seededRandom(i * 19 + 3) * 8000 + 500)}ms`;
      return style as React.CSSProperties;
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 overflow-hidden ${className}`}
    >
      {fireflies.map((style, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length decorative array, never reorders
        <div key={i} className="firefly" style={style} />
      ))}
    </div>
  );
}
