"""Upload pipeline: validate -> parse -> chunk -> embed -> store -> register."""

from datetime import UTC, datetime

from app.constants.upload import ALLOWED_CONTENT_TYPES, ALLOWED_EXTENSIONS
from app.rag import chroma_store, documents
from app.rag.chunking import chunk_pages
from app.rag.embeddings import embed_batch
from app.rag.parsing import parse_document
from app.schemas.documents import UploadResponse
from app.shared.wide_events import DocumentContext, log
from app.utils.errors import create_error


def _resolve_extension(filename: str, content_type: str) -> str:
    if content_type in ALLOWED_CONTENT_TYPES:
        return ALLOWED_CONTENT_TYPES[content_type]
    suffix = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix in ALLOWED_EXTENSIONS:
        return suffix
    raise create_error(
        message="Unsupported file type",
        why=f"Content-Type '{content_type}' and filename '{filename}' are not recognized",
        fix="Upload a PDF, DOCX, TXT, PNG, JPG, or WEBP file",
        status_code=415,
    )


def _validate_size(content: bytes, max_mb: int) -> None:
    max_bytes = max_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise create_error(
            message="File too large",
            why=f"File is {len(content) / 1024 / 1024:.1f}MB, limit is {max_mb}MB",
            fix="Upload a smaller file",
            status_code=413,
        )


async def upload_document(
    *,
    filename: str,
    content_type: str,
    content: bytes,
    max_upload_mb: int,
    session_id: str | None = None,
) -> UploadResponse:
    """Validate, parse, chunk, embed, and register a document. Re-uploading the
    same bytes dedupes to the existing document instead of re-processing —
    the requesting session is still granted visibility into it either way."""
    extension = _resolve_extension(filename, content_type)
    _validate_size(content, max_upload_mb)

    document_id = documents.compute_document_id(content)
    existing = await documents.get_document(document_id)
    if existing is not None:
        if session_id and session_id not in existing.session_ids:
            await documents.add_session(document_id, session_id)
        log.set(document=DocumentContext(id=document_id, filename=filename, dedupe=True))
        return UploadResponse(
            document_id=existing.document_id,
            filename=existing.filename,
            pages=existing.pages,
            chunk_count=existing.chunk_count,
        )

    pages = parse_document(filename=filename, extension=extension, content=content)
    if not pages:
        raise create_error(
            message="No extractable text found",
            why="OCR ran but found no readable text — the file may be blank or too low-quality",
            fix="Upload a document or image with clearer, readable text",
            status_code=422,
        )

    chunks = chunk_pages(pages)
    embeddings = await embed_batch([chunk.text for chunk in chunks])

    await chroma_store.upsert_chunks(
        document_id=document_id,
        filename=filename,
        chunk_ids=[f"{document_id}:{chunk.chunk_index}" for chunk in chunks],
        chunk_texts=[chunk.text for chunk in chunks],
        chunk_pages=[chunk.page for chunk in chunks],
        embeddings=embeddings,
    )

    meta = await documents.save_document(
        document_id=document_id,
        filename=filename,
        extension=extension,
        content=content,
        pages=len(pages),
        chunk_count=len(chunks),
        uploaded_at=datetime.now(UTC).isoformat(),
        session_id=session_id,
    )

    log.set(
        document=DocumentContext(
            id=document_id,
            filename=filename,
            content_type=content_type,
            pages=meta.pages,
            chunk_count=meta.chunk_count,
            size_bytes=meta.size_bytes,
            dedupe=False,
        )
    )
    return UploadResponse(
        document_id=meta.document_id,
        filename=meta.filename,
        pages=meta.pages,
        chunk_count=meta.chunk_count,
    )
