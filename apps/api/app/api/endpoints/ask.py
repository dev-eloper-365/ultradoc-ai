"""POST /ask — RAG question answering with sources, confidence, and guardrails."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_session_id
from app.schemas.ask import AskRequest, AskResponse
from app.services.ask_service import ask_question
from app.shared.wide_events import log

router = APIRouter(tags=["ask"])


@router.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, session_id: str | None = Depends(get_session_id)) -> AskResponse:
    """Answer a question against one or more uploaded documents' indexed chunks."""
    log.set(operation="ask")
    return await ask_question(
        question=request.question,
        document_ids=request.document_ids,
        session_id=session_id,
        history=request.history,
    )
