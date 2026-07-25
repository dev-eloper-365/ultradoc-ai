"""LLM client — a single OpenAI-compatible code path for both providers.

Groq (default) and any self-hosted Ollama server exposing an ``/v1`` endpoint
both speak the OpenAI chat-completions API, so one ``ChatOpenAI`` client
config (base_url + api_key + model) serves either — swapping providers is an
env change, never a code change.

Structured output uses ``method="json_mode"`` (not tool/function calling)
because that is the one structured-output mechanism both Groq and Ollama
support identically; the target schema is embedded in the prompt itself
(see ``ainvoke_structured``).
"""

from functools import lru_cache
from typing import TypeVar

from langchain_core.language_models import LanguageModelInput
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.runnables import Runnable
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.config.settings import get_settings
from app.constants.llm import DEFAULT_LLM_TEMPERATURE, LLM_RETRY_MAX_ATTEMPTS

_StructuredT = TypeVar("_StructuredT", bound=BaseModel)


def with_llm_retry(runnable: Runnable, *, max_attempts: int = LLM_RETRY_MAX_ATTEMPTS) -> Runnable:
    """Wrap a runnable so transient provider/network errors (timeouts, 429s,
    5xx) are retried with exponential backoff before the caller sees them."""
    return runnable.with_retry(stop_after_attempt=max_attempts, wait_exponential_jitter=True)


@lru_cache
def _build_llm(temperature: float) -> ChatOpenAI:
    settings = get_settings()
    return ChatOpenAI(
        base_url=settings.LLM_BASE_URL,
        api_key=settings.LLM_API_KEY or "not-needed",
        model=settings.LLM_MODEL,
        temperature=temperature,
    )


def get_llm(*, temperature: float = DEFAULT_LLM_TEMPERATURE) -> ChatOpenAI:
    """The single factory for the configured chat model. Cached per temperature
    so hot paths reuse one HTTP client instead of rebuilding it per call."""
    return _build_llm(temperature)


async def ainvoke_llm(
    prompt: LanguageModelInput, *, temperature: float = DEFAULT_LLM_TEMPERATURE
) -> BaseMessage:
    """Invoke the chat model on free-form text/messages, with retry."""
    llm = with_llm_retry(get_llm(temperature=temperature))
    return await llm.ainvoke(prompt)


async def ainvoke_structured(
    schema: type[_StructuredT],
    prompt: str,
    *,
    system_prompt: str = "",
    temperature: float = DEFAULT_LLM_TEMPERATURE,
) -> _StructuredT:
    """One-shot structured call: instructs the model to return JSON matching
    ``schema`` (via ``json_mode``, the one structured-output mode Groq and
    Ollama both support), retries transient errors, and validates the result.
    Raises on malformed output — callers needing graceful degradation should
    catch ``Exception`` (see ``guardrails/grounding.py`` for the pattern)."""
    llm = get_llm(temperature=temperature).with_structured_output(schema, method="json_mode")
    llm = with_llm_retry(llm)
    schema_hint = (
        f"Respond with a single JSON object matching this schema:\n{schema.model_json_schema()}"
    )
    messages = [
        SystemMessage(
            content=f"{system_prompt}\n\n{schema_hint}" if system_prompt else schema_hint
        ),
        HumanMessage(content=prompt),
    ]
    return await llm.ainvoke(messages)
