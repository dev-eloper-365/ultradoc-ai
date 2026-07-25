"""Upload validation constants."""

ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
}
ALLOWED_EXTENSIONS: frozenset[str] = frozenset({"pdf", "docx", "txt", "png", "jpg", "jpeg", "webp"})

# Extensions OCR'd via pytesseract rather than parsed as native text.
IMAGE_EXTENSIONS: frozenset[str] = frozenset({"png", "jpg", "jpeg", "webp"})

MAX_UPLOAD_MB_DEFAULT = 10
