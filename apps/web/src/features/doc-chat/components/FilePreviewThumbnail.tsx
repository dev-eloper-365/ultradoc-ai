"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const BROWSER_PREVIEW_EXTENSIONS = new Set(["pdf", "txt"]);

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function DocumentPageFallback() {
  return (
    <div className="absolute inset-0 bg-white px-2 pt-2.5">
      <div className="mb-2 h-1 w-8 rounded-full bg-blue-400" />
      <div className="space-y-1">
        <div className="h-0.5 w-full rounded-full bg-zinc-300" />
        <div className="h-0.5 w-5/6 rounded-full bg-zinc-300" />
        <div className="h-0.5 w-full rounded-full bg-zinc-200" />
        <div className="h-0.5 w-3/4 rounded-full bg-zinc-200" />
        <div className="mt-2 h-0.5 w-full rounded-full bg-zinc-300" />
        <div className="h-0.5 w-4/5 rounded-full bg-zinc-200" />
        <div className="h-0.5 w-full rounded-full bg-zinc-200" />
      </div>
    </div>
  );
}

export function FilePreviewThumbnail({
  documentId,
  filename,
}: {
  documentId: string;
  filename: string;
}) {
  const extension = extensionOf(filename);
  const canRenderOriginal =
    IMAGE_EXTENSIONS.has(extension) || BROWSER_PREVIEW_EXTENSIONS.has(extension);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!canRenderOriginal) return;

    let url: string | null = null;
    let cancelled = false;

    apiClient
      .get(`/documents/${documentId}/file`, { responseType: "blob" })
      .then(async (response) => {
        if (cancelled) return;
        if (extension === "txt") {
          const text = await response.data.text();
          if (!cancelled) setTextPreview(text);
          return;
        }
        url = URL.createObjectURL(response.data);
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [canRenderOriginal, documentId, extension]);

  // Scaling the iframe up and back down with a CSS transform (tried first)
  // doesn't reliably get clipped by the parent's overflow:hidden — iframes
  // paint in their own compositing layer, so a scaled-up one can bleed past
  // its ancestor's bounds instead of being cropped. Sizing it to the actual
  // container and letting PDF.js's own view=FitH fit the page to that width
  // is what actually stays inside the box.
  const previewUrl =
    extension === "pdf" ? `${blobUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH` : blobUrl;

  return (
    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-white shadow-md">
      {!canRenderOriginal || failed ? (
        <DocumentPageFallback />
      ) : !blobUrl && textPreview === null ? (
        <div className="absolute inset-0 animate-pulse bg-zinc-200" />
      ) : extension === "txt" ? (
        <pre className="absolute inset-0 overflow-hidden whitespace-pre-wrap break-words bg-white p-2 text-left font-mono text-[5px] leading-[1.35] text-zinc-700">
          {textPreview}
        </pre>
      ) : IMAGE_EXTENSIONS.has(extension) ? (
        // A blob URL cannot be optimized by next/image.
        <img
          src={blobUrl ?? undefined}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <iframe
          src={previewUrl ?? undefined}
          title={`${filename} thumbnail`}
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-white"
        />
      )}
      <span className="absolute bottom-1 left-1 z-20 rounded bg-zinc-700/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase shadow">
        {extension || "FILE"}
      </span>
    </div>
  );
}
