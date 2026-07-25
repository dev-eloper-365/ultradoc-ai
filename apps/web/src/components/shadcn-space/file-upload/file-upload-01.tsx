"use client";

import {
  ACCEPTED_FILE_TYPES,
  SAMPLE_DOCUMENT_DRAG_TYPE,
  SUPPORTED_FORMATS_LABEL,
} from "@/features/doc-chat/constants";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onChange?: (files: File[]) => void;
}

export const FileUploadStruc: React.FC<FileUploadProps> = ({ onChange }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isSampleDragActive, setIsSampleDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleDragDepth = useRef(0);

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    onChange?.(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleSampleDrop = (event: React.DragEvent<HTMLElement>) => {
    const encodedSample = event.dataTransfer.getData(SAMPLE_DOCUMENT_DRAG_TYPE);
    if (!encodedSample) return;

    event.preventDefault();
    event.stopPropagation();
    sampleDragDepth.current = 0;
    setIsSampleDragActive(false);

    void (async () => {
      try {
        const sample = JSON.parse(encodedSample) as { filename?: string; url?: string };
        if (
          !sample.filename ||
          !sample.url?.startsWith("/sample-documents/") ||
          !sample.filename.toLowerCase().endsWith(".pdf")
        ) {
          return;
        }

        const response = await fetch(sample.url);
        if (!response.ok) throw new Error(`Unable to load ${sample.filename}`);
        const blob = await response.blob();
        handleFileChange([
          new File([blob], sample.filename, {
            type: blob.type || "application/pdf",
          }),
        ]);
      } catch (error) {
        console.error("Unable to import sample document", error);
      }
    })();
  };

  const handleSampleDragEnter = (event: React.DragEvent<HTMLElement>) => {
    if (!Array.from(event.dataTransfer.types).includes(SAMPLE_DOCUMENT_DRAG_TYPE)) return;
    event.preventDefault();
    event.stopPropagation();
    sampleDragDepth.current += 1;
    setIsSampleDragActive(true);
  };

  const handleSampleDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (!Array.from(event.dataTransfer.types).includes(SAMPLE_DOCUMENT_DRAG_TYPE)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleSampleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    if (!Array.from(event.dataTransfer.types).includes(SAMPLE_DOCUMENT_DRAG_TYPE)) return;
    event.preventDefault();
    event.stopPropagation();
    sampleDragDepth.current = Math.max(sampleDragDepth.current - 1, 0);
    if (sampleDragDepth.current === 0) setIsSampleDragActive(false);
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: console.error,
  });

  const formatFileSize = (size: number) => (size / (1024 * 1024)).toFixed(2);

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString();
  const uploadDragActive = isDragActive || isSampleDragActive;

  return (
    <div
      className="w-full"
      {...getRootProps({
        onDragEnter: handleSampleDragEnter,
        onDragLeave: handleSampleDragLeave,
        onDragOver: handleSampleDragOver,
        onDrop: handleSampleDrop,
      })}
    >
      <motion.div
        onClick={handleClick}
        className="group/file relative flex min-h-[32rem] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg p-12"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <RocketUploadPanel dragActive={uploadDragActive}>
          <div className="relative w-full">
            {files.length > 0 ? (
              files.map((file, idx) => (
                <FileItem
                  // biome-ignore lint/suspicious/noArrayIndexKey: index disambiguates same-name re-uploads, appended list never reorders
                  key={file.name + idx}
                  file={file}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                  isFirst={idx === 0}
                />
              ))
            ) : (
              <EmptyState isDragActive={uploadDragActive} />
            )}
          </div>
          <div className="relative z-20 -mt-[-11px] text-center">
            <p className="text-xl font-semibold text-white">Upload Files</p>
            <p className="mt-2 text-xs font-normal text-zinc-400">
              Drag and drop your files here, or{" "}
              <span className="font-medium text-white">click to select.</span>
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              Supported formats: {SUPPORTED_FORMATS_LABEL}
            </p>
          </div>
        </RocketUploadPanel>
      </motion.div>
    </div>
  );
};

// File Item Component
interface FileItemProps {
  file: File;
  formatFileSize: (size: number) => string;
  formatDate: (timestamp: number) => string;
  isFirst: boolean;
}
const FileItem: React.FC<FileItemProps> = ({ file, formatFileSize, formatDate, isFirst }) => (
  <motion.div
    layoutId={isFirst ? "file-upload" : `file-upload-${file.name}`}
    className={cn(
      "relative overflow-hidden z-40 bg-card border flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md shadow-sm",
    )}
  >
    <div className="flex justify-between w-full items-center gap-4">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layout
        className="text-sm font-medium text-foreground truncate max-w-xs"
      >
        {file.name}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layout
        className="rounded-lg px-2 py-1 w-fit shrink-0 text-xs font-medium bg-muted text-muted-foreground shadow-sm"
      >
        {formatFileSize(file.size)} MB
      </motion.p>
    </div>
    <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-muted-foreground">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layout
        className="px-3 py-1 rounded-md bg-muted text-xs"
      >
        {file.type}
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="text-sm">
        modified {formatDate(file.lastModified)}
      </motion.p>
    </div>
  </motion.div>
);

// Empty State Component
interface EmptyStateProps {
  isDragActive: boolean;
}
const EmptyState: React.FC<EmptyStateProps> = ({ isDragActive }) => (
  <motion.div
    layoutId="file-upload"
    className="relative z-40 flex h-28 w-full items-center justify-center"
  >
    {isDragActive ? (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-2 text-muted-foreground"
      >
        Drop it
        <Image
          src="/file-icons/upload-stack.png"
          alt=""
          width={516}
          height={528}
          className="h-20 w-auto object-contain"
        />
      </motion.p>
    ) : (
      <Image
        src="/file-icons/upload-stack.png"
        alt="Upload files"
        width={516}
        height={528}
        className="h-34 w-auto object-contain transition-transform duration-300 ease-out group-hover/rocket:-translate-y-2 group-hover/rocket:scale-110"
      />
    )}
  </motion.div>
);

const RocketUploadPanel: React.FC<{ children: React.ReactNode; dragActive: boolean }> = ({
  children,
  dragActive,
}) => {
  const rocketRef = useRef<HTMLDivElement>(null);
  const thrustRef = useRef<HTMLDivElement>(null);
  const outlineGlowRef = useRef<HTMLDivElement>(null);
  const idleTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      const rocket = rocketRef.current;
      const thrust = thrustRef.current;
      const outlineGlow = outlineGlowRef.current;
      if (!rocket || !thrust || !outlineGlow) return;

      gsap.set(thrust, { opacity: 0, scaleX: 0.75, scaleY: 0.7 });
      gsap.set(outlineGlow, { opacity: 0 });
      media.add("(prefers-reduced-motion: no-preference)", () => {
        idleTimelineRef.current = gsap
          .timeline({ repeat: -1, yoyo: true })
          .to(rocket, { y: -4, duration: 1.25, ease: "sine.inOut" });
      });
    }, rocketRef);

    return () => {
      gsap.killTweensOf([rocketRef.current, thrustRef.current, outlineGlowRef.current]);
      media.revert();
      context.revert();
    };
  }, []);

  const launch = useCallback(() => {
    const rocket = rocketRef.current;
    const thrust = thrustRef.current;
    const outlineGlow = outlineGlowRef.current;
    if (!rocket || !thrust || !outlineGlow) return;

    idleTimelineRef.current?.pause();
    gsap
      .timeline({ defaults: { duration: 0.38, ease: "power2.out", overwrite: "auto" } })
      .to(
        rocket,
        {
          y: -10,
          scale: 1.015,
        },
        0,
      )
      .to(outlineGlow, { opacity: 1 }, 0)
      .to(thrust, { opacity: 0.5, scaleX: 1.05, scaleY: 1.2 }, 0);
  }, []);

  const settle = useCallback(() => {
    const rocket = rocketRef.current;
    const thrust = thrustRef.current;
    const outlineGlow = outlineGlowRef.current;
    if (!rocket || !thrust || !outlineGlow) return;

    gsap
      .timeline({
        defaults: { duration: 0.4, ease: "power2.out", overwrite: "auto" },
        onComplete: () => idleTimelineRef.current?.restart(),
      })
      .to(
        rocket,
        {
          y: 0,
          scale: 1,
        },
        0,
      )
      .to(outlineGlow, { opacity: 0 }, 0)
      .to(thrust, { opacity: 0, scaleX: 0.75, scaleY: 0.7 }, 0);
  }, []);

  const wasDragActiveRef = useRef(false);
  useEffect(() => {
    if (dragActive) launch();
    else if (wasDragActiveRef.current) settle();
    wasDragActiveRef.current = dragActive;
  }, [dragActive, launch, settle]);

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="pointer-events-none absolute -bottom-4 left-1/2 z-20 -translate-x-1/2">
        <div ref={thrustRef} className="relative h-20 w-24 origin-top">
          <div className="absolute top-0 left-1/2 h-20 w-16 -translate-x-1/2 rounded-[50%] bg-primary/50 blur-2xl" />
          <div className="absolute bottom-0 left-1/2 h-8 w-24 -translate-x-1/2 rounded-[50%] bg-primary/30 blur-2xl" />
        </div>
      </div>
      <div
        ref={rocketRef}
        className="group/rocket relative z-30 flex w-full flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-background px-8 pt-10 pb-8"
        onPointerEnter={launch}
        onPointerLeave={() => {
          if (!dragActive) settle();
        }}
      >
        <div
          ref={outlineGlowRef}
          className="pointer-events-none absolute -inset-px z-50 rounded-2xl border border-primary/65 shadow-[0_0_32px_rgba(0,187,255,0.24)]"
        />
        {children}
      </div>
    </div>
  );
};

const FileUploadMotion = () => {
  const [file, setFile] = useState<File[]>([]);
  const handleFileUpload = (files: File[]) => {
    setFile(files);
  };
  return (
    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-background border-muted rounded-xl flex items-center justify-center p-10">
      <FileUploadStruc onChange={handleFileUpload} />
    </div>
  );
};

export default FileUploadMotion;
