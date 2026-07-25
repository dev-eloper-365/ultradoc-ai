"""LLM provider defaults. A single OpenAI-compatible code path serves both
Groq (default, hosted) and any self-hosted Ollama server exposing an
``/v1`` endpoint — only ``LLM_BASE_URL`` / ``LLM_MODEL`` need to change."""

DEFAULT_LLM_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_LLM_MODEL = "llama-3.3-70b-versatile"
DEFAULT_LLM_TEMPERATURE = 0.0

LLM_RETRY_MAX_ATTEMPTS = 3
