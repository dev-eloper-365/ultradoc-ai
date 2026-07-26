"use client";

import { FileStack, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

import { DocChip } from "@/features/doc-chat/components/DocChip";
import { UploadDropzone } from "@/features/doc-chat/components/UploadDropzone";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

/**
 * Sidebar "Assets" panel — every uploaded document, each with its preview
 * thumbnail. Questions/extractions always run across every uploaded
 * document — the backend auto-detects which one(s) a question targets.
 * "Add documents" reveals an inline dropzone without leaving the chat view.
 */
export function DocumentTray({ onStartOver }: { onStartOver: () => void }) {
  const documents = useDocStore((state) => state.documents);
  const removeDocument = useDocStore((state) => state.removeDocument);
  const [addingMore, setAddingMore] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <FileStack className="size-3.5" aria-hidden />
          Assets
          <span className="text-zinc-600">· {documents.length}</span>
        </div>
        <button
          type="button"
          onClick={onStartOver}
          title="Clear all documents and start over"
          className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {documents.map((document) => (
          <DocChip
            key={document.document_id}
            document={document}
            onRemove={() => removeDocument(document.document_id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setAddingMore((value) => !value)}
        className="flex items-center justify-center gap-1 rounded-2xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-zinc-400 backdrop-blur-xl transition-colors hover:border-white/40 hover:text-white"
      >
        <Plus className="size-3.5" />
        Add documents
      </button>

      {addingMore && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-2 backdrop-blur-xl">
          <UploadDropzone />
        </div>
      )}
    </div>
  );
}
