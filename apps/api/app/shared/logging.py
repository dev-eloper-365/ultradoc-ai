"""Logging configuration for the UltraDoc API.

Console output is colorized and human-readable by default. Set
``LOG_FORMAT=json`` to emit flat NDJSON to stdout instead (useful for shipping
logs to any log aggregator in a hosted deployment).

Environment variables:
- LOG_LEVEL: minimum log level (default: INFO)
- LOG_FORMAT: "console" (default) or "json"
"""

from __future__ import annotations

import json as _json
import os
import sys
from typing import TYPE_CHECKING

from loguru import logger

if TYPE_CHECKING:
    from loguru import Message, Record

_CONSOLE_FORMAT = (
    "<green>{time:MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<level>{message}</level> "
    "<dim><cyan>({file.name}:{line})</cyan></dim>"
)

_CONFIGURED = False


def _build_json_entry(record: Record) -> str:
    entry: dict[str, object] = {
        "time": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "module": record["module"],
        "line": record["line"],
    }
    entry.update(record["extra"])
    if record["exception"] is not None:
        exc = record["exception"]
        entry["exception"] = {
            "type": exc.type.__name__ if exc.type else None,
            "value": str(exc.value) if exc.value else None,
        }
    return _json.dumps(entry, default=str) + "\n"


def _json_sink(message: Message) -> None:
    sys.stdout.write(_build_json_entry(message.record))
    sys.stdout.flush()


def configure_logging() -> None:
    """Configure the process-wide loguru sinks. Idempotent — safe to call twice."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    _CONFIGURED = True

    level = os.getenv("LOG_LEVEL", "INFO")
    format_mode = os.getenv("LOG_FORMAT", "console")

    logger.remove()
    if format_mode == "json":
        logger.add(_json_sink, level=level)
    else:
        logger.add(sys.stdout, level=level, format=_CONSOLE_FORMAT, colorize=True)
