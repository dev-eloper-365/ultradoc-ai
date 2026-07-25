"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { DocumentPreview } from "@/features/doc-chat/components/DocumentPreview";
import { FilePreviewThumbnail } from "@/features/doc-chat/components/FilePreviewThumbnail";
import type { UploadResponse } from "@/types/api";

export function DocChip({
  document,
  onRemove,
}: {
  document: UploadResponse;
  onRemove: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRect, setPreviewRect] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const openPreview = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) setPreviewRect({ top: rect.bottom + 8, left: rect.left });
    setPreviewOpen(true);
  };

  useEffect(() => {
    if (!previewOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setPreviewOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.document.addEventListener("mousedown", onPointerDown);
    window.document.addEventListener("keydown", onKeyDown);
    return () => {
      window.document.removeEventListener("mousedown", onPointerDown);
      window.document.removeEventListener("keydown", onKeyDown);
    };
  }, [previewOpen]);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/10 py-2.5 pr-4 pl-2.5 backdrop-blur-xl transition-colors">
        <button
          type="button"
          onClick={openPreview}
          title="Click to preview"
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <FilePreviewThumbnail documentId={document.document_id} filename={document.filename} />
          <div className="min-w-0">
            <p className="max-w-[10rem] truncate text-xs font-medium text-white">
              {document.filename}
            </p>
            <p className="text-[10px] text-zinc-500">
              {document.pages} page{document.pages === 1 ? "" : "s"} · {document.chunk_count} chunks
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove from this session"
          className="rounded-full p-0.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {previewOpen &&
        previewRect &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: previewRect.top, left: previewRect.left }}
            className="fixed z-50 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg"
          >
            <p className="truncate border-b border-zinc-800 px-3 py-2 text-xs font-medium text-white">
              {document.filename}
            </p>
            <DocumentPreview documentId={document.document_id} filename={document.filename} />
          </div>,
          window.document.body,
        )}
    </div>
  );
}
