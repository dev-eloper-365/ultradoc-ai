"""RAG tuning constants: chunking, retrieval, guardrails, confidence scoring.

Starting points are adapted from a whole-document RAG pipeline (dense retrieval
+ cross-encoder rerank + blended confidence gating), recalibrated for
whole-document Q&A instead of short-fact memory recall. Every threshold
lives here so tuning is a one-file change.
"""

# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
CHUNK_SIZE_CHARS = 1200
CHUNK_OVERLAP_CHARS = 200

# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------
ANN_CANDIDATES = 12
RERANK_BLEND_WEIGHT = 0.6  # weight of cross-encoder rerank vs. raw cosine

# A chunk is "confident" (trusted evidence) if either signal alone clears its
# bar — the two disagree often enough that requiring both misses real hits.
CONFIDENT_COSINE = 0.55
CONFIDENT_RERANK_LOGIT = -2.5

MAX_WEAK_RESULTS = 4  # cap on non-confident chunks kept alongside confident ones

# Drop chunks scoring below this fraction of the top score. Was 0.4, found too
# aggressive for small documents: with only 2-3 ANN candidates, min-max
# normalization stretches even a small raw-score gap into a full 0-1 spread,
# so a genuinely relevant #2 chunk (the reranker and cosine can legitimately
# disagree on ranking) gets discarded before the LLM ever sees it. 0.15 still
# cuts the truly-irrelevant tail on larger candidate sets.
RELEVANCE_DROPOFF_RATIO = 0.15

# Below this blended top score, refuse before ever calling the LLM.
REFUSAL_FLOOR = 0.3

REFUSAL_MESSAGE = "Not found in document."

# ---------------------------------------------------------------------------
# Grounding guardrail (post-generation verifier)
# ---------------------------------------------------------------------------
GROUNDING_VERIFIER_TIMEOUT_SECONDS = 8.0

GROUNDING_FACTOR_SUPPORTED = 1.0
GROUNDING_FACTOR_PARTIAL = 0.6
GROUNDING_FACTOR_UNSUPPORTED = 0.2
GROUNDING_FACTOR_NEUTRAL = 0.5  # verifier didn't run (timeout / parse failure)

# ---------------------------------------------------------------------------
# Confidence scoring — weighted blend of retrieval, chunk agreement, grounding
# ---------------------------------------------------------------------------
CONFIDENCE_WEIGHT_RETRIEVAL = 0.5
CONFIDENCE_WEIGHT_AGREEMENT = 0.2
CONFIDENCE_WEIGHT_GROUNDING = 0.3

CONFIDENCE_TIER_HIGH = 0.75
CONFIDENCE_TIER_MEDIUM = 0.5

# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------
EXTRACTION_MAX_CHARS = 60_000  # document text cap fed to the extraction prompt

# ---------------------------------------------------------------------------
# Conversation history (/ask multi-turn context)
# ---------------------------------------------------------------------------
# Most recent turns kept, oldest dropped first — bounds prompt size and stops
# a long-running chat from ever-increasing latency/cost per question.
HISTORY_MAX_TURNS = 6
