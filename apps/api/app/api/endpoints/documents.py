"""GET /documents — list documents visible to the requesting session, plus
GET /documents/{id}/file to serve the original bytes for inline preview."""

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.api.dependencies import get_session_id
from app.constants.upload import ALLOWED_CONTENT_TYPES
from app.rag import documents
from app.schemas.documents import DocumentListResponse, DocumentSummary
from app.utils.errors import create_error

router = APIRouter(tags=["documents"])

_EXTENSION_TO_CONTENT_TYPE = {extension: content_type for content_type, extension in ALLOWED_CONTENT_TYPES.items()}


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(session_id: str | None = Depends(get_session_id)) -> DocumentListResponse:
    """Documents uploaded by the requesting session, most recent first (every
    document, unscoped, if the caller sent no ``X-Session-Id``)."""
    entries = await documents.list_documents(session_id=session_id)
    return DocumentListResponse(
        documents=[
            DocumentSummary(
                document_id=entry.document_id,
                filename=entry.filename,
                pages=entry.pages,
                chunk_count=entry.chunk_count,
                uploaded_at=entry.uploaded_at,
            )
            for entry in entries
        ]
    )


@router.get("/documents/{document_id}/file")
async def get_document_file(
    document_id: str, session_id: str | None = Depends(get_session_id)
) -> FileResponse:
    """Serve a document's original bytes for inline preview — PDFs and images
    render natively in the browser; other supported types fall back to a
    generic download content-type."""
    meta = await documents.get_document(document_id)
    if meta is None or (session_id is not None and session_id not in meta.session_ids):
        raise create_error(
            message="Document not found",
            why="No document with that id is visible to this session",
            fix="Check the document_id and X-Session-Id",
            status_code=404,
        )
    path = documents.original_file_path(document_id, meta.extension)
    content_type = _EXTENSION_TO_CONTENT_TYPE.get(meta.extension, "application/octet-stream")
    return FileResponse(path, media_type=content_type, filename=meta.filename)
