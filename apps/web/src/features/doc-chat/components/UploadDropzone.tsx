"use client";

import { FileStack } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { ACCEPTED_FILE_TYPES, SUPPORTED_FORMATS_LABEL } from "@/features/doc-chat/constants";
import { useUploadDocuments } from "@/features/doc-chat/hooks/useUploadDocuments";
import { cn } from "@/lib/utils";

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useUploadDocuments();

  const handleFiles = useCallback(
    (files: File[]) => {
      if (files.length > 0) mutate(files);
    },
    [mutate],
  );

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(Array.from(event.dataTransfer.files));
      }}
      disabled={isPending}
      className={cn(
        "flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-transparent p-10 text-center transition-all",
        isDragging && "scale-[1.02] border-primary bg-primary/5",
        isPending && "cursor-wait opacity-70",
      )}
    >
      <div className="relative">
        <FileStack className="size-16 text-zinc-600" strokeWidth={1.25} />
        <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-white">
          {isPending ? "…" : "↑"}
        </span>
      </div>
      <div>
        <p className="text-lg font-semibold text-white">Upload Files</p>
        <p className="mt-2 text-sm text-zinc-400">
          {isPending ? (
            "Uploading..."
          ) : (
            <>
              Drag and drop your files here, or{" "}
              <span className="text-primary underline-offset-2 hover:underline">
                click to select.
              </span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-zinc-500">Supported formats: {SUPPORTED_FORMATS_LABEL}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={(event) => handleFiles(Array.from(event.target.files ?? []))}
      />
    </button>
  );
}
