"""Pydantic schemas for the document upload/registry endpoints."""

from pydantic import BaseModel


class UploadResponse(BaseModel):
    """Response returned by POST /upload."""

    document_id: str
    filename: str
    pages: int
    chunk_count: int
    status: str = "ready"


class UploadBatchItem(BaseModel):
    """One file's outcome within POST /upload/batch."""

    filename: str
    document: UploadResponse | None = None
    error: str | None = None


class UploadBatchResponse(BaseModel):
    """Response returned by POST /upload/batch — per-file results so one bad
    file doesn't fail the whole batch."""

    results: list[UploadBatchItem]


class DocumentSummary(BaseModel):
    """One entry in GET /documents."""

    document_id: str
    filename: str
    pages: int
    chunk_count: int
    uploaded_at: str


class DocumentListResponse(BaseModel):
    """Response returned by GET /documents."""

    documents: list[DocumentSummary]
