"use client";

import { FileStack, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

import { DocChip } from "@/features/doc-chat/components/DocChip";
import { UploadDropzone } from "@/features/doc-chat/components/UploadDropzone";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

/**
 * Main-screen "Assets" view — every uploaded document as a card in a grid.
 * Reached via the "Assets" item in the Ask/Extract/Assets side switch.
 * Questions/extractions always run across every uploaded document — the
 * backend auto-detects which one(s) a question targets. "Add documents"
 * reveals an inline dropzone without leaving the view.
 */
export function AssetsPanel({ onStartOver }: { onStartOver: () => void }) {
  const documents = useDocStore((state) => state.documents);
  const removeDocument = useDocStore((state) => state.removeDocument);
  const [addingMore, setAddingMore] = useState(false);

  return (
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
          <FileStack className="size-4" aria-hidden />
          Assets
          <span className="text-zinc-600">· {documents.length}</span>
        </div>
        <button
          type="button"
          onClick={onStartOver}
          title="Clear all documents and start over"
          className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
