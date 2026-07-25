"""Document registry — filesystem-backed, no database required.

Layout: ``{DATA_DIR}/uploads/{document_id}/original.<ext>`` plus a sibling
``meta.json``. ``document_id`` is a content hash (sha256 prefix), so
re-uploading the same file dedupes instead of creating a duplicate entry.
"""

import asyncio
import hashlib
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

from app.config.settings import get_settings

_ID_LENGTH = 16


@dataclass
class DocumentMeta:
    """Registry entry for one uploaded document.

    ``session_ids`` is additive, not an owner: content-addressed dedupe means
    two different sessions uploading the same bytes should both see the
    document (no re-parsing/re-embedding), so a session is added to the list
    rather than replacing it. A document with no session ids attached (e.g.
    everything persisted before this field existed) is only visible to
    unscoped callers — never leaks into a real browser session's list.
    """

    document_id: str
    filename: str
    extension: str
    pages: int
    chunk_count: int
    size_bytes: int
    uploaded_at: str
    session_ids: list[str] = field(default_factory=list)


def compute_document_id(content: bytes) -> str:
    """Content-addressed id — identical uploads dedupe to the same document."""
    return hashlib.sha256(content).hexdigest()[:_ID_LENGTH]


def _uploads_dir() -> Path:
    return Path(get_settings().DATA_DIR) / "uploads"


def _document_dir(document_id: str) -> Path:
    return _uploads_dir() / document_id


def _write_sync(*, document_id: str, extension: str, content: bytes, meta: DocumentMeta) -> None:
    directory = _document_dir(document_id)
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f"original.{extension}").write_bytes(content)
    (directory / "meta.json").write_text(json.dumps(asdict(meta), indent=2))


def _read_meta_sync(document_id: str) -> DocumentMeta | None:
    meta_path = _document_dir(document_id) / "meta.json"
    if not meta_path.exists():
        return None
    return DocumentMeta(**json.loads(meta_path.read_text()))


def _add_session_sync(document_id: str, session_id: str) -> None:
    meta = _read_meta_sync(document_id)
    if meta is None or session_id in meta.session_ids:
        return
    meta.session_ids.append(session_id)
    (_document_dir(document_id) / "meta.json").write_text(json.dumps(asdict(meta), indent=2))


def _list_sync() -> list[DocumentMeta]:
    root = _uploads_dir()
    if not root.exists():
        return []
    entries = [
        DocumentMeta(**json.loads((child / "meta.json").read_text()))
        for child in sorted(root.iterdir())
        if (child / "meta.json").exists()
    ]
    return sorted(entries, key=lambda entry: entry.uploaded_at, reverse=True)


async def save_document(
    *,
    document_id: str,
    filename: str,
    extension: str,
    content: bytes,
    pages: int,
    chunk_count: int,
    uploaded_at: str,
    session_id: str | None = None,
) -> DocumentMeta:
    """Persist the original file bytes and registry metadata for a document."""
    meta = DocumentMeta(
        document_id=document_id,
        filename=filename,
        extension=extension,
        pages=pages,
        chunk_count=chunk_count,
        size_bytes=len(content),
        uploaded_at=uploaded_at,
        session_ids=[session_id] if session_id else [],
    )
    await asyncio.to_thread(
        _write_sync, document_id=document_id, extension=extension, content=content, meta=meta
    )
    return meta


async def add_session(document_id: str, session_id: str) -> None:
    """Grant an additional session visibility into an already-registered
    document (the dedupe path: a second session uploaded identical bytes)."""
    await asyncio.to_thread(_add_session_sync, document_id, session_id)


async def get_document(document_id: str) -> DocumentMeta | None:
    """Look up one document's registry metadata by id."""
    return await asyncio.to_thread(_read_meta_sync, document_id)


async def list_documents(session_id: str | None = None) -> list[DocumentMeta]:
    """Uploaded documents, most recently uploaded first.

    ``session_id=None`` returns every document (unscoped — used by direct
    API/script callers that don't send a session header). Given a
    ``session_id``, only documents that session has uploaded (or dedupe-hit)
    are returned — this is what keeps a fresh browser session from seeing
    every document anyone has ever uploaded to this instance."""
    entries = await asyncio.to_thread(_list_sync)
    if session_id is None:
        return entries
    return [entry for entry in entries if session_id in entry.session_ids]


async def get_latest_document_id(session_id: str | None = None) -> str | None:
    """The most recently uploaded document's id within scope, or None."""
    entries = await list_documents(session_id=session_id)
    return entries[0].document_id if entries else None


def original_file_path(document_id: str, extension: str) -> Path:
    """Path to a document's original uploaded bytes, for inline preview."""
    return _document_dir(document_id) / f"original.{extension}"


async def read_full_text(document_id: str, extension: str) -> str:
    """Re-parse a stored document's full text (used by extraction, which needs
    the whole document rather than individual retrieved chunks)."""
    from app.rag.parsing import parse_document  # local import avoids a cycle

    path = _document_dir(document_id) / f"original.{extension}"
    content = await asyncio.to_thread(path.read_bytes)
    pages = parse_document(filename=document_id, extension=extension, content=content)
    return "\n\n".join(page.text for page in pages)
