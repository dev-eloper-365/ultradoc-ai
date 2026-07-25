"""Request middleware: wide-event lifecycle (reset at start, emit at end)."""

import time

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.shared.wide_events import emit_wide_event, log


class WideEventMiddleware(BaseHTTPMiddleware):
    """Resets the wide-event accumulator per request and flushes one structured
    log line (``http_request``) on completion, carrying every field any
    handler/service set via ``log.set()`` during the request."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        log.reset()
        started = time.monotonic()
        log.set(method=request.method, path=request.url.path)
        response = await call_next(request)
        log.set(status_code=response.status_code)
        emit_wide_event("http_request", started=started)
        return response


def configure_middleware(app: FastAPI) -> None:
    """Register the wide-event request middleware."""
    app.add_middleware(WideEventMiddleware)
