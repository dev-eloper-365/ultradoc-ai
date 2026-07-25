"""Pydantic schemas for POST /ask."""

from typing import Literal

from pydantic import BaseModel


class HistoryTurn(BaseModel):
    """One prior turn of the conversation, as the client already has it."""

    role: Literal["user", "assistant"]
    content: str


class AskRequest(BaseModel):
    """Request body for POST /ask.

    ``document_ids`` scopes the question to specific documents. Omit it (or
    pass an empty list) to let retrieval auto-detect which document(s) the
    question targets across everything uploaded so far.

    ``history`` is the recent prior turns of this chat (client-owned — the
    backend has no conversation store), oldest first. It's used to interpret
    follow-up questions ("what about the delivery date instead?") — both to
    resolve what's actually being asked and to steer retrieval — but never as
    a source of facts: every answer is still grounded only in the retrieved
    document chunks, never in what was said earlier in the chat. Only the
    most recent ``HISTORY_MAX_TURNS`` are used; anything older is ignored.
    """

    question: str
    document_ids: list[str] | None = None
    history: list[HistoryTurn] | None = None


class SourceChunk(BaseModel):
    """One retrieved chunk cited as supporting evidence for an answer."""

    text: str
    page: int
    chunk_index: int
    score: float
    document_id: str
    filename: str


class ConfidenceBreakdown(BaseModel):
    """The three components blended into the final confidence score."""

    retrieval: float
    agreement: float
    grounding: float


class AskResponse(BaseModel):
    """Response returned by POST /ask.

    When ``document_ids`` isn't given and the question's evidence spans more
    than one uploaded document, this is still a single synthesized answer —
    ``sources`` may then include chunks from multiple documents, and the
    answer text itself explains any real cross-document discrepancy (or asks
    a clarifying question if genuinely ambiguous). See ``ask_service``.
    """

    answer: str
    refused: bool
    sources: list[SourceChunk]
    confidence: float
    confidence_tier: str
    confidence_breakdown: ConfidenceBreakdown
    model: str
