"""Application settings: load from env, validate, and expose typed access.

Read values via ``from app.config.settings import get_settings``.
"""

from functools import lru_cache
from typing import Literal

from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.constants.llm import DEFAULT_LLM_BASE_URL, DEFAULT_LLM_MODEL
from app.constants.upload import MAX_UPLOAD_MB_DEFAULT

load_dotenv()


class Settings(BaseSettings):
    """Process-wide configuration, loaded once and cached via ``get_settings()``."""

    ENV: Literal["production", "development"] = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    # LLM — one OpenAI-compatible client serves Groq (default) or any hosted
    # Ollama server exposing an /v1 endpoint.
    LLM_BASE_URL: str = DEFAULT_LLM_BASE_URL
    LLM_API_KEY: str = ""
    LLM_MODEL: str = DEFAULT_LLM_MODEL

    # Embeddings — local fastembed models, no cloud key required.
    # Small fastembed-native models — fits Render's free 512MB tier (1.2GB +
    # 156MB for mxbai-embed-large + jina-turbo blew way past it). ~170MB
    # combined vs ~1.36GB before. Confidence thresholds in constants/rag.py
    # are recalibrated for these models' score distributions.
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    RERANKER_MODEL: str = "Xenova/ms-marco-MiniLM-L-6-v2"
    MODEL_CACHE_DIR: str | None = "data/models"

    # Storage
    DATA_DIR: str = "data"
    MAX_UPLOAD_MB: int = MAX_UPLOAD_MB_DEFAULT

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("FRONTEND_URL", "LLM_BASE_URL", mode="after")
    @classmethod
    def _strip_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    """Memoized settings instance."""
    return Settings()
