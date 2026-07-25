"""POST /upload — accept a document and index it for retrieval."""

import asyncio

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.dependencies import get_session_id
from app.config.settings import get_settings
from app.schemas.documents import UploadBatchItem, UploadBatchResponse, UploadResponse
from app.services.document_service import upload_document
from app.shared.wide_events import log
from app.utils.errors import AppError

router = APIRouter(tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload(
    file: UploadFile = File(...), session_id: str | None = Depends(get_session_id)
) -> UploadResponse:
    """Parse (OCR'ing images/scanned pages as needed), chunk, embed, and
    index an uploaded PDF/DOCX/TXT/PNG/JPG/WEBP document."""
    log.set(operation="upload")
    content = await file.read()
    settings = get_settings()
    return await upload_document(
        filename=file.filename or "upload",
        content_type=file.content_type or "",
        content=content,
        max_upload_mb=settings.MAX_UPLOAD_MB,
        session_id=session_id,
    )


async def _upload_one(
    file: UploadFile, *, max_upload_mb: int, session_id: str | None
) -> UploadBatchItem:
    filename = file.filename or "upload"
    try:
        content = await file.read()
        document = await upload_document(
            filename=filename,
            content_type=file.content_type or "",
            content=content,
            max_upload_mb=max_upload_mb,
            session_id=session_id,
        )
        return UploadBatchItem(filename=filename, document=document)
    except AppError as error:
        return UploadBatchItem(filename=filename, error=error.message)
    except Exception as error:
        return UploadBatchItem(filename=filename, error=str(error))


@router.post("/upload/batch", response_model=UploadBatchResponse)
async def upload_batch(
    files: list[UploadFile] = File(...), session_id: str | None = Depends(get_session_id)
) -> UploadBatchResponse:
    """Upload multiple documents in one request. Each file is processed
    independently — one invalid/oversized file doesn't fail the others."""
    log.set(operation="upload_batch")
    settings = get_settings()
    results = await asyncio.gather(
        *(
            _upload_one(file, max_upload_mb=settings.MAX_UPLOAD_MB, session_id=session_id)
            for file in files
        )
    )
    return UploadBatchResponse(results=list(results))
