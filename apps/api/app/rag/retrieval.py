"""Hybrid retrieval for /ask: embed -> ANN -> cross-encoder rerank -> blend ->
confidence gating. Simplified to a single-collection, single-signal (dense ANN,
no FTS/RRF) pipeline since whole-document Q&A has no full-text index to fuse
against.
"""

import math
from dataclasses import dataclass

from app.constants.rag import (
    ANN_CANDIDATES,
    CONFIDENT_COSINE,
    CONFIDENT_RERANK_LOGIT,
    MAX_WEAK_RESULTS,
    RELEVANCE_DROPOFF_RATIO,
    RERANK_BLEND_WEIGHT,
)
from app.rag import chroma_store
from app.rag.embeddings import embed_query, rerank


@dataclass
class RetrievedChunk:
    """A chunk selected as evidence for an answer, with its blended score."""

    text: str
    page: int
    chunk_index: int
    score: float
    confident: bool
    document_id: str
    filename: str


def _min_max_normalize(scores: list[float]) -> list[float]:
    """Squash cross-encoder logits to [0, 1]; a degenerate range maps to 1.0."""
    low, high = min(scores), max(scores)
    if math.isclose(low, high):
        return [1.0] * len(scores)
    return [(score - low) / (high - low) for score in scores]


def _cap_weak_results(candidates: list[RetrievedChunk]) -> list[RetrievedChunk]:
    """Keep every confident chunk but at most MAX_WEAK_RESULTS unproven ones —
    an unanswerable query surfaces a couple of semi-related chunks at most
    instead of a full page of noise."""
    kept: list[RetrievedChunk] = []
    weak_kept = 0
    for chunk in candidates:
        if not chunk.confident:
            if weak_kept >= MAX_WEAK_RESULTS:
                continue
            weak_kept += 1
        kept.append(chunk)
    return kept


def _drop_below_relevance(chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
    """Cut the weak tail: drop chunks scoring below RELEVANCE_DROPOFF_RATIO of
    the top score, so one strong hit doesn't drag in unrelated filler."""
    if not chunks:
        return chunks
    floor = chunks[0].score * RELEVANCE_DROPOFF_RATIO
    return [chunk for chunk in chunks if chunk.score >= floor]


async def retrieve(
    query: str, *, document_ids: list[str] | None, limit: int
) -> list[RetrievedChunk]:
    """Embed the query, run dense ANN, rerank, blend, and gate by confidence.
    ``document_ids=None`` (or empty) searches across every uploaded document.
    Returns chunks sorted best-first, already capped and dropoff-filtered."""
    query_embedding = await embed_query(query)
    hits = await chroma_store.query_similar(
        query_embedding, ANN_CANDIDATES, document_ids=document_ids
    )
    if not hits:
        return []

    raw_rerank_scores = await rerank(query, [hit.text for hit in hits])
    rerank_norm = _min_max_normalize(raw_rerank_scores)

    scored = [
        RetrievedChunk(
            text=hit.text,
            page=hit.page,
            chunk_index=hit.chunk_index,
            score=RERANK_BLEND_WEIGHT * rerank_score
            + (1.0 - RERANK_BLEND_WEIGHT) * hit.cosine_similarity,
            confident=(
                hit.cosine_similarity >= CONFIDENT_COSINE or raw_score >= CONFIDENT_RERANK_LOGIT
            ),
            document_id=hit.document_id,
            filename=hit.filename,
        )
        for hit, rerank_score, raw_score in zip(hits, rerank_norm, raw_rerank_scores, strict=True)
    ]
    scored.sort(key=lambda chunk: chunk.score, reverse=True)

    capped = _cap_weak_results(scored)[:limit]
    return _drop_below_relevance(capped)
