"""Application factory for the UltraDoc AI FastAPI application."""

import re

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router as api_router
from app.config.settings import get_settings
from app.core.middleware import configure_middleware
from app.shared.wide_events import log
from app.utils.errors import AppError

_VERCEL_PREVIEW_ORIGIN_REGEX = re.compile(r"https://ultradoc-ai(?:-[a-z0-9-]+)?\.vercel\.app")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()
    is_prod = settings.ENV == "production"

    app = FastAPI(
        title="UltraDoc AI",
        description="Document intelligence: upload, ask, and extract structured data.",
        openapi_url=None if is_prod else "/openapi.json",
        docs_url=None if is_prod else "/docs",
        redoc_url=None if is_prod else "/redoc",
    )

    allowed_origins = {
        "http://localhost:3000",
        "https://ultradoc-ai.vercel.app",
    }
    if settings.FRONTEND_URL:
        allowed_origins.add(settings.FRONTEND_URL)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=sorted(allowed_origins),
        allow_origin_regex=_VERCEL_PREVIEW_ORIGIN_REGEX.pattern,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    configure_middleware(app)

    def _cors_headers(request: Request) -> dict[str, str]:
        """CORS headers for responses built by handlers registered for the bare
        ``Exception`` class. Starlette routes those to ``ServerErrorMiddleware``,
        which sits *outside* every user middleware — including ``CORSMiddleware``
        — so its responses never get CORS headers applied automatically. Without
        this, any unhandled exception looks like a CORS failure in the browser
        instead of the actual 500, because the missing header is what the
        browser reports, hiding the real error."""
        origin = request.headers.get("origin")
        if not origin:
            return {}
        if origin in allowed_origins or _VERCEL_PREVIEW_ORIGIN_REGEX.fullmatch(origin):
            return {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Vary": "Origin",
            }
        return {}

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        """Convert AppError into a structured JSON response with wide event context."""
        log.error(
            "app_error",
            error=exc.to_dict(),
            status_code=exc.status_code,
            path=request.url.path,
            method=request.method,
        )
        return JSONResponse(status_code=exc.status_code, content=exc.to_dict())

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Log validation errors with field-level detail and return 422."""
        errors = [
            {"loc": list(err["loc"]), "msg": err["msg"], "type": err["type"]}
            for err in exc.errors()
        ]
        log.warning("validation_failed", validation_errors=errors, error_count=len(errors))
        return JSONResponse(status_code=422, content={"detail": errors})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch all unhandled exceptions, log them, and return 500."""
        log.error("unhandled_exception", error_type=type(exc).__name__, error_message=str(exc))
        return JSONResponse(
            status_code=500,
            content={"error": "internal_server_error"},
            headers=_cors_headers(request),
        )

    app.include_router(api_router)

    return app
