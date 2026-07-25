"""Wide event logging — one context-rich structured event per request.

Each request accumulates fields via ``log.set(...)`` throughout its handler
and service calls; the logging middleware emits exactly one structured line
per request on completion. This makes every request fully queryable (which
document, which retrieval scores, which guardrail verdict) from one log line
instead of grepping through scattered print-style logs.

Usage:
    from app.shared.wide_events import log

    log.set(document={"id": doc_id, "filename": name})
    log.warning("something odd", detail=...)   # also appended to event["warnings"]
"""

import contextvars
import time
import uuid
from typing import Any, TypedDict

from loguru import logger as _loguru

_LEVEL_ORDER: dict[str, int] = {"DEBUG": 0, "INFO": 1, "WARNING": 2, "ERROR": 3, "CRITICAL": 4}

_wide_event: contextvars.ContextVar[dict[str, Any] | None] = contextvars.ContextVar(
    "wide_event", default=None
)
_max_level: contextvars.ContextVar[str] = contextvars.ContextVar(
    "wide_event_max_level", default="INFO"
)
_trace_id: contextvars.ContextVar[str] = contextvars.ContextVar("wide_event_trace_id", default="")


class DocumentContext(TypedDict, total=False):
    """Document upload/registry operation context."""

    id: str
    filename: str
    content_type: str
    pages: int
    chunk_count: int
    size_bytes: int
    dedupe: bool


class RetrievalContext(TypedDict, total=False):
    """Chunk retrieval diagnostics for a single /ask call."""

    document_ids: list[str]
    query: str
    candidate_count: int
    confident_count: int
    top_score: float
    refused_pre_llm: bool


class GuardrailContext(TypedDict, total=False):
    """Post-generation grounding verifier outcome."""

    verdict: str
    verifier_ran: bool
    unsupported_claim_count: int
    latency_ms: float


class LLMContext(TypedDict, total=False):
    """LLM call accounting."""

    provider: str
    model: str
    operation: str  # "ask" | "extract" | "grounding_check"
    latency_ms: float
    retry_attempt: int


class WideEventLogger:
    """Drop-in structured logger that accumulates one wide event per request."""

    def set(self, **kwargs: Any) -> None:
        """Merge structured context into the current request's wide event."""
        current = _wide_event.get() or {}
        _wide_event.set({**current, **kwargs})

    def debug(self, message: str, **kwargs: Any) -> None:
        _loguru.opt(depth=1).debug(message, **kwargs)

    def info(self, message: str, **kwargs: Any) -> None:
        _loguru.opt(depth=1).info(message, **kwargs)

    def warning(self, message: str, **kwargs: Any) -> None:
        _loguru.opt(depth=1).warning(message, **kwargs)
        self._append("warnings", message, **kwargs)
        self._bump("WARNING")

    def error(self, message: str, **kwargs: Any) -> None:
        exc_info = kwargs.pop("exc_info", False)
        _loguru.opt(depth=1, exception=exc_info).error(message, **kwargs)
        self._append("errors", message, **kwargs)
        self._bump("ERROR")

    def get(self) -> dict[str, Any]:
        """Return the accumulated wide event dict for this request."""
        return _wide_event.get() or {}

    def get_max_level(self) -> str:
        return _max_level.get()

    def get_trace_id(self) -> str:
        return _trace_id.get()

    def reset(self) -> None:
        """Reset the wide event for a new request. Called by the middleware."""
        _max_level.set("INFO")
        trace_id = uuid.uuid4().hex[:16]
        _trace_id.set(trace_id)
        _wide_event.set({"trace_id": trace_id})

    def _append(self, category: str, message: str, **kwargs: Any) -> None:
        current = _wide_event.get() or {}
        items = [*current.get(category, []), {"msg": message, **kwargs}]
        _wide_event.set({**current, category: items})

    def _bump(self, level: str) -> None:
        current = _max_level.get()
        if _LEVEL_ORDER.get(level, 0) > _LEVEL_ORDER.get(current, 0):
            _max_level.set(level)


log = WideEventLogger()


def emit_wide_event(event_name: str, *, started: float) -> None:
    """Flush the accumulated wide event as one structured log line. Called by
    the request middleware after the response is produced (success or error)."""
    duration_ms = round((time.monotonic() - started) * 1000, 2)
    log.set(duration_ms=duration_ms)
    level = log.get_max_level()
    log.set(final_level=level)
    event = log.get()
    _loguru.bind(**event).log(level, event_name)
