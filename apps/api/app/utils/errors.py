"""Structured application errors with rich context for wide-event logging.

Usage:
    from app.utils.errors import create_error

    raise create_error(
        message="Unsupported file type",
        why="Only PDF, DOCX and TXT are accepted",
        fix="Convert the file and re-upload",
        status_code=415,
    )
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AppError(Exception):
    """Structured application error with context for debugging and wide events."""

    message: str
    why: str = ""
    fix: str = ""
    status_code: int = 500
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {"message": self.message}
        if self.why:
            payload["why"] = self.why
        if self.fix:
            payload["fix"] = self.fix
        payload.update(self.meta)
        return payload


def create_error(
    message: str,
    why: str = "",
    fix: str = "",
    status_code: int = 500,
    **meta: Any,
) -> AppError:
    """Create a structured AppError with optional context metadata."""
    return AppError(message=message, why=why, fix=fix, status_code=status_code, meta=meta)


__all__ = ["AppError", "create_error"]
