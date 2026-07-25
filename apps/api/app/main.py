"""UltraDoc AI API entry point.

Run locally:
    uv run uvicorn app.main:app --reload --port 8000
"""

from app.core.app_factory import create_app
from app.shared.logging import configure_logging

configure_logging()

app = create_app()
