"use client";

import { ChevronDown, FileText, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

import { DocChip } from "@/features/doc-chat/components/DocChip";
import { UploadDropzone } from "@/features/doc-chat/components/UploadDropzone";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

/**
 * Row of every uploaded document. Questions/extractions always run across
 * every uploaded document — the backend auto-detects which one(s) a
 * question targets and asks for clarification if ambiguous. "Add documents"
 * reveals an inline dropzone for uploading more without leaving the chat view.
 * Collapsed by default so Ask/Extract get the vertical space back; expand to
 * manage documents.
 */
export function DocumentTray({ onStartOver }: { onStartOver: () => void }) {
  const documents = useDocStore((state) => state.documents);
  const removeDocument = useDocStore((state) => state.removeDocument);
  const [addingMore, setAddingMore] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 backdrop-blur-xl transition-colors hover:text-white"
      >
        <FileText className="size-3.5" />
        {documents.length} document{documents.length === 1 ? "" : "s"}
        <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            {documents.map((document) => (
              <DocChip
                key={document.document_id}
                document={document}
                onRemove={() => removeDocument(document.document_id)}
              />
            ))}
            <button
              type="button"
              onClick={() => setAddingMore((value) => !value)}
              className="flex shrink-0 items-center gap-1 rounded-2xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-zinc-400 backdrop-blur-xl transition-colors hover:border-white/40 hover:text-white"
            >
              <Plus className="size-3.5" />
              Add documents
            </button>
            <button
              type="button"
              onClick={onStartOver}
              title="Clear all documents and start over"
              className="flex shrink-0 items-center gap-1 rounded-2xl px-3 py-2 text-xs text-zinc-500 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="size-3.5" />
              Start over
            </button>
          </div>
          {addingMore && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-2 backdrop-blur-xl">
              <UploadDropzone />
            </div>
          )}
        </>
      )}
    </div>
  );
}
