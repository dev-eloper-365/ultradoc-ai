"""Shared FastAPI dependencies."""

from fastapi import Header


async def get_session_id(x_session_id: str | None = Header(default=None)) -> str | None:
    """Optional per-browser-tab id the web client sends on every request
    (``X-Session-Id``) so uploaded documents are scoped to the session that
    uploaded them, instead of every document ever uploaded to this instance
    being visible to any fresh browser session. Callers that omit the header
    (direct API/script use) fall back to the unscoped global document pool —
    session scoping is purely additive, not an auth boundary."""
    return x_session_id
