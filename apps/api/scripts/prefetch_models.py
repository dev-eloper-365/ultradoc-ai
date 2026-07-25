"""Pre-download the fastembed embedding + reranker models.

Run once after ``uv sync`` (or let the first /upload call trigger it lazily).
Useful for Docker image builds — bake models into the image layer instead of
downloading them on every container start.

Usage:
    uv run python scripts/prefetch_models.py
"""

from app.config.settings import get_settings
from app.rag.embeddings import _get_embedding_model, _get_reranker_model


def main() -> None:
    settings = get_settings()
    print(f"Downloading embedding model: {settings.EMBEDDING_MODEL}")
    _get_embedding_model()
    print(f"Downloading reranker model: {settings.RERANKER_MODEL}")
    _get_reranker_model()
    print("Done.")


if __name__ == "__main__":
    main()
