"use client";

import {
  type ConfidenceReason,
  ConfidenceScore,
  type SourceItem,
} from "@/features/doc-chat/components/ConfidenceScore";
import type { AskResponse, ConfidenceTier } from "@/types/api";

const TIER_LABEL: Record<ConfidenceTier, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

function pct(value: number) {
  return Math.round(value * 100);
}

// Mirrors CONFIDENCE_WEIGHT_* in apps/api/app/constants/rag.py — the weighted
// blend the backend uses to produce the final `confidence` value.
const RETRIEVAL_WEIGHT = 0.5;
const AGREEMENT_WEIGHT = 0.2;
const GROUNDING_WEIGHT = 0.3;

// Mirrors CONFIDENCE_WEIGHT_* / the guardrail chain in apps/api/app/services/ask_service.py.
function buildReasons(ask: AskResponse): ConfidenceReason[] {
  if (ask.refused) {
    return [
      {
        label: "No retrieved passage cleared the confidence floor",
        detail: `${pct(ask.confidence_breakdown.retrieval)}% best match`,
      },
    ];
  }

  const { retrieval, agreement, grounding } = ask.confidence_breakdown;
  return [
    { label: "Retrieval similarity", detail: `${pct(retrieval)}%` },
    { label: "Chunk agreement", detail: `${pct(agreement)}%` },
    { label: "Answer coverage", detail: `${pct(grounding)}%` },
    {
      label: "Heuristic scoring",
      detail: `${RETRIEVAL_WEIGHT}×${pct(retrieval)}% + ${AGREEMENT_WEIGHT}×${pct(agreement)}% + ${GROUNDING_WEIGHT}×${pct(grounding)}% = ${pct(ask.confidence)}%`,
    },
  ];
}

// Every score ships with what to actually do about it — the anti-pattern
// this pattern exists to avoid is a number with no next action attached.
function buildGuidance(ask: AskResponse): string {
  if (ask.refused) {
    return "Try rephrasing the question, or check the document directly — no confident match was found.";
  }
  if (ask.confidence_tier === "high") return "Well supported by the document — safe to use as-is.";
  if (ask.confidence_tier === "medium")
    return "Partially supported — worth a quick check against the cited source.";
  return "Evidence is weak — verify with the original document before relying on this.";
}

export function AnswerMeta({ ask }: { ask: AskResponse }) {
  const sources: SourceItem[] = ask.sources.map((source) => ({
    id: `${source.document_id}:${source.chunk_index}`,
    filename: source.filename,
    page: source.page,
    score: source.score,
    text: source.text,
  }));

  return (
    <ConfidenceScore
      status="success"
      // A refusal never wears a confidence label/percentage — "89% confident"
      // next to a non-answer is the exact anti-pattern this component exists
      // to avoid, so refusals get a plain, unscored "No answer found" state.
      label={ask.refused ? "No answer found" : TIER_LABEL[ask.confidence_tier]}
      score={ask.refused ? undefined : ask.confidence}
      reasons={buildReasons(ask)}
      guidance={buildGuidance(ask)}
      sources={sources}
    />
  );
}
