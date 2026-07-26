"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

/** Minimal preview of an uploaded file's original bytes — PDFs and text
 * render inline (native browser viewer via an iframe), images as an <img>,
 * anything else (docx) falls back to a plain download link since no browser
 * renders it inline. */
export function DocumentPreview({
  documentId,
  filename,
}: {
  documentId: string;
  filename: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const extension = extensionOf(filename);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;

    apiClient
      .get(`/documents/${documentId}/file`, { responseType: "blob" })
      .then(async (response) => {
        if (cancelled) return;
        if (extension === "txt") {
          const text = await response.data.text();
          if (!cancelled) setTextContent(text);
          return;
        }
        url = URL.createObjectURL(response.data);
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [documentId, extension]);

  if (error) {
    return <p className="p-3 text-xs text-amber-300">Couldn't load a preview for this file.</p>;
  }

  if (!blobUrl && textContent === null) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs text-zinc-500">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Loading preview…
      </div>
    );
  }

  if (extension === "txt") {
    return (
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words bg-white p-4 font-mono text-xs leading-relaxed text-zinc-800">
        {textContent}
      </pre>
    );
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    // blob: URL — next/image can't optimize a local object URL, so a plain <img> is correct here.
    return (
      <img
        src={blobUrl ?? undefined}
        alt={filename}
        className="max-h-72 w-full rounded-b-xl object-contain"
      />
    );
  }

  if (extension === "pdf") {
    // #toolbar=0 is Chrome's own PDF-viewer flag — hides its built-in
    // download/print/etc. toolbar strip so it doesn't look like part of the
    // page chrome.
    return (
      <iframe
        src={blobUrl ? `${blobUrl}#toolbar=0` : undefined}
        title={filename}
        className="h-96 w-full rounded-b-xl border-0 bg-white"
      />
    );
  }

  return (
    <p className="p-3 text-xs text-zinc-400">
      No inline preview for this file type.{" "}
      <a href={blobUrl ?? undefined} download={filename} className="text-primary underline">
        Download {filename}
      </a>
    </p>
  );
}
