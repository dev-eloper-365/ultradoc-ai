"""POST /extract — structured shipment field extraction from a document."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_session_id
from app.schemas.extract import ExtractRequest, ExtractResponse
from app.services.extract_service import extract_shipment
from app.shared.wide_events import log

router = APIRouter(tags=["extract"])


@router.post("/extract", response_model=ExtractResponse)
async def extract(
    request: ExtractRequest, session_id: str | None = Depends(get_session_id)
) -> ExtractResponse:
    """Extract the structured shipment fields from one or more uploaded
    documents (every document visible to this session if ``document_ids`` is
    omitted)."""
    log.set(operation="extract")
    return await extract_shipment(document_ids=request.document_ids, session_id=session_id)
