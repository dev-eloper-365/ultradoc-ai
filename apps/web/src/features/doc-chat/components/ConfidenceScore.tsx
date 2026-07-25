"use client";

import { AlertTriangle, ChevronDown, FileText } from "lucide-react";
import { useId, useState } from "react";

export type ConfidenceStatus = "idle" | "loading" | "success" | "error";

export interface ConfidenceReason {
  /** Plain-language reason, e.g. "Strong match to the source passage". */
  label: string;
  /** Optional supporting number, e.g. "92% retrieval similarity". */
  detail?: string;
}

export interface SourceItem {
  id: string;
  filename: string;
  page: number;
  score: number;
  text: string;
}

export interface ConfidenceScoreProps {
  status: ConfidenceStatus;
  /** Header text — e.g. "High confidence" or "No answer found". */
  label?: string;
  /** 0..1. Rendered as a percentage next to the label; omit to hide (e.g. on a refusal, where a percentage next to "no answer" is the exact anti-pattern this component exists to avoid). */
  score?: number;
  /** Bullet reasons revealed by "Why?". */
  reasons?: ConfidenceReason[];
  /** What the user should do about this score — always shown when reasons are open, never left implicit. */
  guidance?: string;
  /** status === "error" message. */
  errorMessage?: string;
  sources?: SourceItem[];
  /** Both disclosures start closed unless set — the score should never cost a click to see, only to audit. */
  defaultExpanded?: boolean;
  className?: string;
}

export function ConfidenceScore({
  status,
  label,
  score,
  reasons = [],
  guidance,
  errorMessage,
  sources = [],
  defaultExpanded = false,
  className = "",
}: ConfidenceScoreProps) {
  const [whyOpen, setWhyOpen] = useState(defaultExpanded);
  const [sourcesOpen, setSourcesOpen] = useState(defaultExpanded);
  const whyId = useId();
  const sourcesId = useId();

  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <div className={`w-full ${className}`} aria-live="polite" aria-busy="true">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-700/60" aria-hidden />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className={`flex items-center gap-2 text-xs text-amber-300 ${className}`}>
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
        {errorMessage ?? "Couldn't score this answer."}
      </div>
    );
  }

  const hasWhy = reasons.length > 0 || Boolean(guidance);

  const closeWhyOnEscape = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && whyOpen) {
      setWhyOpen(false);
      event.currentTarget.blur();
    }
  };

  const closeSourcesOnEscape = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && sourcesOpen) {
      setSourcesOpen(false);
      event.currentTarget.blur();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-xs font-medium text-white">
          {label}
          {typeof score === "number" && (
            <span className="ml-1 font-normal text-zinc-500">· {Math.round(score * 100)}%</span>
          )}
        </span>
        {hasWhy && (
          <button
            type="button"
            aria-expanded={whyOpen}
            aria-controls={whyId}
            onClick={() => setWhyOpen((value) => !value)}
            onKeyDown={closeWhyOnEscape}
            className="flex items-center gap-1 rounded text-xs text-zinc-500 hover:text-white focus-visible:text-white focus-visible:underline focus-visible:decoration-dotted focus-visible:underline-offset-4 focus-visible:outline-none"
          >
            Why?
            <ChevronDown
              className={`size-3 transition-transform ${whyOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        )}

        {sources.length > 0 && (
          <button
            type="button"
            aria-expanded={sourcesOpen}
            aria-controls={sourcesId}
            onClick={() => setSourcesOpen((value) => !value)}
            onKeyDown={closeSourcesOnEscape}
            className="flex items-center gap-1 rounded text-xs text-zinc-500 hover:text-white focus-visible:text-white focus-visible:underline focus-visible:decoration-dotted focus-visible:underline-offset-4 focus-visible:outline-none"
          >
            {sources.length} source{sources.length === 1 ? "" : "s"}
            <ChevronDown
              className={`size-3 transition-transform ${sourcesOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        )}
      </div>

      {whyOpen && hasWhy && (
        <div
          id={whyId}
          role="region"
          aria-label="Why this confidence score"
          className="mt-2 border-t border-zinc-800 pt-2"
        >
          <ul className="space-y-1.5 text-xs text-zinc-500">
            {reasons.map((reason) => (
              <li key={reason.label} className="flex gap-2">
                <span aria-hidden>•</span>
                <span>
                  {reason.label}
                  {reason.detail && <span className="text-zinc-600"> — {reason.detail}</span>}
                </span>
              </li>
            ))}
            {guidance && (
              <li className="flex gap-2 border-t border-zinc-800 pt-1.5 text-zinc-400">
                <span aria-hidden>→</span>
                <span>{guidance}</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {sourcesOpen && sources.length > 0 && (
        <div id={sourcesId} role="region" aria-label="Sources" className="mt-2 space-y-1.5">
          {sources.map((source) => (
            <div key={source.id} className="border-t border-zinc-800 pt-1.5">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-zinc-500">
                <span className="flex min-w-0 items-center gap-1 text-zinc-400">
                  <FileText className="size-3 shrink-0 text-primary" aria-hidden />
                  <span className="truncate font-medium">{source.filename}</span>
                  <span className="shrink-0">· p.{source.page}</span>
                </span>
                <span className="shrink-0">{Math.round(source.score * 100)}% match</span>
              </div>
              <p className="line-clamp-3 text-xs text-zinc-500">{source.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
