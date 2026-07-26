"use client";

import { LayoutGrid, List as ListIcon, Plus, RotateCcw, Search, X } from "lucide-react";
import Image from "next/image";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MacShortcutHint } from "@/components/ui/mac-shortcut-hint";
import { DocumentPreview } from "@/features/doc-chat/components/DocumentPreview";
import { FilePreviewThumbnail } from "@/features/doc-chat/components/FilePreviewThumbnail";
import { UploadDropzone } from "@/features/doc-chat/components/UploadDropzone";
import { useDocStore } from "@/features/doc-chat/stores/docStore";
import type { UploadResponse } from "@/types/api";

type ViewMode = "list" | "grid";

const FILE_ICON_BY_EXTENSION: Record<string, string> = {
  pdf: "/file-icons/pdf.png",
  txt: "/file-icons/text.png",
  doc: "/file-icons/document.png",
  docx: "/file-icons/document.png",
  png: "/file-icons/image.png",
  jpg: "/file-icons/image.png",
  jpeg: "/file-icons/image.png",
  webp: "/file-icons/image.png",
};

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function fileIconSrc(filename: string): string {
  return FILE_ICON_BY_EXTENSION[extensionOf(filename)] ?? "/file-icons/document.png";
}

/** Opens a floating preview of a document's original file just below a
 * trigger element, closing on outside click or Escape. Shared by both the
 * list-row and grid-card asset layouts below. */
function useDocumentPreviewPopover() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  const openPreview = () => {
    const box = wrapperRef.current?.getBoundingClientRect();
    if (box) setAnchor({ top: box.bottom + 8, left: box.left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.document.addEventListener("mousedown", onPointerDown);
    window.document.addEventListener("keydown", onKeyDown);
    return () => {
      window.document.removeEventListener("mousedown", onPointerDown);
      window.document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return { wrapperRef, popoverRef, open, anchor, openPreview };
}

function PreviewPopover({
  document,
  anchor,
  popoverRef,
}: {
  document: UploadResponse;
  anchor: { top: number; left: number };
  popoverRef: RefObject<HTMLDivElement | null>;
}) {
  return createPortal(
    <div
      ref={popoverRef}
      style={{ top: anchor.top, left: anchor.left }}
      className="fixed z-50 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg"
    >
      <p className="truncate border-b border-zinc-800 px-3 py-2 text-xs font-medium text-white">
        {document.filename}
      </p>
      <DocumentPreview documentId={document.document_id} filename={document.filename} />
    </div>,
    window.document.body,
  );
}

function AssetRow({ document }: { document: UploadResponse }) {
  const { wrapperRef, popoverRef, open, anchor, openPreview } = useDocumentPreviewPopover();

  return (
    <div
      ref={wrapperRef}
      className="group relative flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 backdrop-blur-xl transition-colors hover:border-white/10 hover:bg-white/[0.06]"
    >
      <button
        type="button"
        onClick={openPreview}
        title="Click to preview"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Image
          src={fileIconSrc(document.filename)}
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{document.filename}</p>
          <p className="text-xs text-zinc-500">{document.chunk_count} chunks indexed</p>
        </div>
      </button>

      <p className="hidden shrink-0 text-xs text-zinc-500 sm:block">
        {document.pages} page{document.pages === 1 ? "" : "s"}
      </p>

      {open && anchor && (
        <PreviewPopover document={document} anchor={anchor} popoverRef={popoverRef} />
      )}
    </div>
  );
}

function AssetCard({ document }: { document: UploadResponse }) {
  const { wrapperRef, popoverRef, open, anchor, openPreview } = useDocumentPreviewPopover();

  return (
    <div
      ref={wrapperRef}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-colors hover:border-white/20"
    >
      <button
        type="button"
        onClick={openPreview}
        title="Click to preview"
        className="flex h-56 items-center justify-center bg-zinc-950/40 p-4"
      >
        <FilePreviewThumbnail
          documentId={document.document_id}
          filename={document.filename}
          className="h-full w-full"
        />
      </button>

      <div className="border-t border-white/10 px-3 py-2.5">
        <p className="truncate text-sm font-medium text-white">{document.filename}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {document.pages} page{document.pages === 1 ? "" : "s"} · {document.chunk_count} chunks
        </p>
      </div>

      {open && anchor && (
        <PreviewPopover document={document} anchor={anchor} popoverRef={popoverRef} />
      )}
    </div>
  );
}

/**
 * Main-screen "Assets" view — a searchable file browser over every uploaded
 * document, switchable between a list and a card grid. Reached via the
 * "Assets" item in the Ask/Extract/Assets side switch. Questions/extractions
 * always run across every uploaded document — the backend auto-detects which
 * one(s) a question targets. "Add documents" reveals an inline dropzone
 * without leaving the view.
 */
export function AssetsPanel({ onStartOver }: { onStartOver: () => void }) {
  const documents = useDocStore((state) => state.documents);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [addingMore, setAddingMore] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((document) => document.filename.toLowerCase().includes(q));
  }, [documents, query]);

  return (
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 py-4">
      <div className="-mx-1 flex min-h-12 w-[calc(100%+0.5rem)] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
        <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
        <input
          ref={searchInputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search assets"
          className="min-w-0 flex-1 appearance-none bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            title="Clear search"
            className="shrink-0 rounded-full p-0.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
        <MacShortcutHint keys={["⌘", "K"]} label="Press Command plus K to search" />
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-zinc-500">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
          {query ? ` for “${query}”` : ""}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartOver}
            title="Clear all documents and start over"
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <div className="flex items-center gap-0.5 rounded-full bg-black/20 p-0.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setView("list")}
              title="List view"
              className={`rounded-full p-1.5 transition-colors ${
                view === "list" ? "bg-primary text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <ListIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              title="Grid view"
              className={`rounded-full p-1.5 transition-colors ${
                view === "grid" ? "bg-primary text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-zinc-500">No documents match “{query}”.</p>
      ) : view === "list" ? (
        <div className="flex flex-col gap-2">
          {filtered.map((document) => (
            <AssetRow key={document.document_id} document={document} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((document) => (
            <AssetCard key={document.document_id} document={document} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setAddingMore((value) => !value)}
        className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-zinc-400 backdrop-blur-xl transition-colors hover:border-white/40 hover:text-white"
      >
        <Plus className="size-4" />
        Add documents
      </button>

      {addingMore && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-3 backdrop-blur-xl">
          <UploadDropzone />
        </div>
      )}
    </div>
  );
}
