"""Chunking: per-page text -> overlapping chunks with page metadata.

Uses a boundary-aware recursive character splitter (paragraph -> sentence ->
word -> character) rather than a fixed-width windower, so chunks break at
natural text boundaries instead of mid-sentence.
"""

from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.constants.rag import CHUNK_OVERLAP_CHARS, CHUNK_SIZE_CHARS
from app.rag.parsing import PageText


@dataclass
class Chunk:
    """One retrievable unit of document text."""

    chunk_index: int
    page: int
    text: str


def chunk_pages(pages: list[PageText]) -> list[Chunk]:
    """Split every page independently so each chunk keeps a single, correct
    page number — splitting across page boundaries would blur that metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE_CHARS,
        chunk_overlap=CHUNK_OVERLAP_CHARS,
    )
    chunks: list[Chunk] = []
    for page in pages:
        for piece in splitter.split_text(page.text):
            chunks.append(Chunk(chunk_index=len(chunks), page=page.page, text=piece))
    return chunks
