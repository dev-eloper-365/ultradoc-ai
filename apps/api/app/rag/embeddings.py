"""Embedding + reranking — local fastembed models, lazy process-wide singletons.

Wraps fastembed's ONNX ``TextEmbedding`` (mxbai-embed-large, 1024-dim) and
``TextCrossEncoder`` reranker. fastembed is sync and CPU-bound, so every call
runs in a worker thread and never blocks the event loop.
"""

import asyncio
import threading
import time

from fastembed import TextEmbedding
from fastembed.rerank.cross_encoder import TextCrossEncoder

from app.config.settings import get_settings
from app.shared.wide_events import log

_embedding_model: TextEmbedding | None = None
_embedding_lock = threading.Lock()

_reranker_model: TextCrossEncoder | None = None
_reranker_lock = threading.Lock()


def _get_embedding_model() -> TextEmbedding:
    global _embedding_model
    if _embedding_model is None:
        with _embedding_lock:
            if _embedding_model is None:
                settings = get_settings()
                started = time.perf_counter()
                _embedding_model = TextEmbedding(
                    model_name=settings.EMBEDDING_MODEL,
                    cache_dir=settings.MODEL_CACHE_DIR,
                )
                log.info(
                    f"Loaded embedding model {settings.EMBEDDING_MODEL} "
                    f"in {time.perf_counter() - started:.2f}s"
                )
    return _embedding_model


def _get_reranker_model() -> TextCrossEncoder:
    global _reranker_model
    if _reranker_model is None:
        with _reranker_lock:
            if _reranker_model is None:
                settings = get_settings()
                started = time.perf_counter()
                _reranker_model = TextCrossEncoder(
                    model_name=settings.RERANKER_MODEL,
                    cache_dir=settings.MODEL_CACHE_DIR,
                )
                log.info(
                    f"Loaded reranker model {settings.RERANKER_MODEL} "
                    f"in {time.perf_counter() - started:.2f}s"
                )
    return _reranker_model


def _embed_sync(texts: list[str]) -> list[list[float]]:
    model = _get_embedding_model()
    return [vector.tolist() for vector in model.embed(texts)]


def _embed_query_sync(text: str) -> list[float]:
    """mxbai/BGE-family models are asymmetric: queries need the model's
    retrieval instruction prefix to match against plain passage embeddings.
    ``query_embed`` applies it; plain ``embed`` (used for passages) does not."""
    model = _get_embedding_model()
    return next(iter(model.query_embed([text]))).tolist()


def _rerank_sync(query: str, documents: list[str]) -> list[float]:
    model = _get_reranker_model()
    return [float(score) for score in model.rerank(query, documents)]


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed a batch of passage texts in one fastembed pass."""
    if not texts:
        return []
    return await asyncio.to_thread(_embed_sync, texts)


async def embed_query(text: str) -> list[float]:
    """Embed a single query string with the model's query instruction."""
    return await asyncio.to_thread(_embed_query_sync, text)


async def rerank(query: str, documents: list[str]) -> list[float]:
    """Return cross-encoder relevance scores for documents, aligned with input order."""
    if not documents:
        return []
    return await asyncio.to_thread(_rerank_sync, query, documents)
