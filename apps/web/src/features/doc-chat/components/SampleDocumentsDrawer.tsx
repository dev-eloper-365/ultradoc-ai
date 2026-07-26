"use client";

import { gsap } from "gsap";
import { ChevronRight, GripVertical, Loader2, UploadCloud } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import DotBackgroundDemo from "@/components/ui/dot-background-demo";
import { SAMPLE_DOCUMENT_DRAG_TYPE } from "@/features/doc-chat/constants";
import { useUploadDocuments } from "@/features/doc-chat/hooks/useUploadDocuments";

const SAMPLE_DOCUMENTS = [
  {
    filename: "BOL53657_billoflading.pdf",
    url: "/sample-documents/BOL53657_billoflading.pdf",
    label: "Bill of Lading",
  },
  {
    filename: "LD53657-Carrier-RC.pdf",
    url: "/sample-documents/LD53657-Carrier-RC.pdf",
    label: "Carrier Rate Confirmation",
  },
  {
    filename: "LD53657-Shipper-RC.pdf",
    url: "/sample-documents/LD53657-Shipper-RC.pdf",
    label: "Shipper Rate Confirmation",
  },
] as const;

export function SampleDocumentsDrawer() {
  const [open, setOpen] = useState(false);
  const [isToggleGlowActive, setIsToggleGlowActive] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { mutate: upload, isPending: isUploadingAll } = useUploadDocuments();

  const uploadAllSamples = async () => {
    const files = await Promise.all(
      SAMPLE_DOCUMENTS.map(async (sample) => {
        const response = await fetch(sample.url);
        const blob = await response.blob();
        return new File([blob], sample.filename, { type: blob.type || "application/pdf" });
      }),
    );
    upload(files);
  };

  useLayoutEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(drawer, {
          width: open ? 288 : 0,
          marginLeft: open ? 16 : 0,
          opacity: open ? 1 : 0,
          x: open ? 0 : -20,
          duration: 0.52,
          ease: open ? "power3.out" : "power2.inOut",
          overwrite: true,
        });
      });
      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(drawer, {
          width: open ? 288 : 0,
          marginLeft: open ? 16 : 0,
          opacity: open ? 1 : 0,
          x: 0,
        });
      });
    }, drawer);

    return () => {
      media.revert();
      context.revert();
    };
  }, [open]);

  useLayoutEffect(() => {
    let animationFrame = 0;

    const updateProximity = (event: PointerEvent) => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const toggle = toggleRef.current;
        if (!toggle) return;

        const bounds = toggle.getBoundingClientRect();
        const distanceX = Math.max(bounds.left - event.clientX, 0, event.clientX - bounds.right);
        const distanceY = Math.max(bounds.top - event.clientY, 0, event.clientY - bounds.bottom);
        setIsToggleGlowActive(Math.hypot(distanceX, distanceY) <= 64);
      });
    };

    const clearProximity = () => setIsToggleGlowActive(false);

    document.body.addEventListener("pointermove", updateProximity, { passive: true });
    window.addEventListener("blur", clearProximity);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.body.removeEventListener("pointermove", updateProximity);
      window.removeEventListener("blur", clearProximity);
    };
  }, []);

  return (
    <div className="relative h-[32rem] shrink-0">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close sample documents" : "Open sample documents"}
        className="group/sample-toggle absolute top-1/2 -left-0.5 z-[70] flex h-16 w-[34px] -translate-y-1/2 items-center justify-center text-zinc-400 transition-colors hover:text-primary focus-visible:text-primary"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 34 64"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <pattern id="sample-toggle-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#404040" />
            </pattern>
            <filter id="sample-toggle-glow" x="-60%" y="-30%" width="220%" height="160%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>

          {/* One inset compound silhouette covers the rectangle edge and forms the semicircle. */}
          <path d="M2 0 A32 32 0 0 1 2 64 L0 64 L0 0 Z" className="fill-background" />
          {/* Occlude the parent border/glow where the semicircle replaces its middle edge. */}
          <rect x="-6" y="1.5" width="14" height="61" fill="#111111" />
          <path
            d="M2 0 A32 32 0 0 1 2 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="text-zinc-800"
          />
          <path
            d="M2 0 A32 32 0 0 1 2 64"
            fill="none"
            stroke="#00bbff"
            strokeWidth="3"
            filter="url(#sample-toggle-glow)"
            className={`transition-opacity duration-200 ${
              isToggleGlowActive ? "opacity-60" : "opacity-0"
            } group-hover/sample-toggle:opacity-60 group-focus-visible/sample-toggle:opacity-60`}
          />
          <path
            d="M2 0 A32 32 0 0 1 2 64"
            fill="none"
            stroke="#00bbff"
            strokeWidth="2"
            className={`transition-opacity duration-200 ${
              isToggleGlowActive ? "opacity-100" : "opacity-0"
            } group-hover/sample-toggle:opacity-100 group-focus-visible/sample-toggle:opacity-100`}
          />
          <path d="M0 0 H2 M0 64 H2" fill="none" stroke="#27272a" strokeWidth="1" />
          <path
            d="M0 0 H2 M0 64 H2"
            fill="none"
            stroke="#00bbff"
            strokeWidth="2"
            className={`transition-opacity duration-200 ${
              isToggleGlowActive ? "opacity-100" : "opacity-0"
            } group-hover/sample-toggle:opacity-100 group-focus-visible/sample-toggle:opacity-100`}
          />
          <path d="M2 0 A32 32 0 0 1 2 64 L0 64 L0 0 Z" fill="url(#sample-toggle-dots)" />
        </svg>
        <ChevronRight
          className={`relative z-30 size-5 transition-transform duration-500 ${open ? "rotate-180" : ""}`}
        />
        <span
          role="tooltip"
          className="pointer-events-none absolute top-1/2 left-10 z-30 -translate-y-1/2 translate-x-1 rounded-full border-[0.5px] border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 whitespace-nowrap opacity-0 backdrop-blur-xl transition-all duration-200 group-hover/sample-toggle:translate-x-0 group-hover/sample-toggle:opacity-100 group-focus-visible/sample-toggle:translate-x-0 group-focus-visible/sample-toggle:opacity-100"
        >
          Sample Docs
        </span>
      </button>

      <div ref={drawerRef} className="h-full w-0 overflow-hidden opacity-0">
        <aside className="h-full w-72 overflow-hidden rounded-3xl border border-dashed border-white/15 bg-white/5 shadow-2xl backdrop-blur-2xl">
          <DotBackgroundDemo className="h-full">
            <div className="flex h-full flex-col p-4">
              <div className="mb-4 pl-2">
                <p className="text-sm font-semibold text-white">Sample documents</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Drag a sample onto the upload area.
                </p>
              </div>

              <button
                type="button"
                onClick={uploadAllSamples}
                disabled={isUploadingAll}
                className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploadingAll ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <UploadCloud className="size-3.5" aria-hidden />
                )}
                {isUploadingAll ? "Uploading…" : "Upload all samples"}
              </button>

              <div className="flex flex-1 flex-col gap-3">
                {SAMPLE_DOCUMENTS.map((sample) => (
                  <div
                    key={sample.filename}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "copy";
                      event.dataTransfer.setData(
                        SAMPLE_DOCUMENT_DRAG_TYPE,
                        JSON.stringify({ filename: sample.filename, url: sample.url }),
                      );
                      event.dataTransfer.setData("text/plain", sample.filename);
                    }}
                    className="group flex cursor-grab items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-2.5 backdrop-blur-xl transition-colors hover:border-primary/40 active:cursor-grabbing"
                  >
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-white">
                      <iframe
                        src={`${sample.url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        title={`${sample.label} preview`}
                        tabIndex={-1}
                        className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-white"
                      />
                      <span className="absolute bottom-1 left-1 z-20 rounded bg-zinc-700/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        PDF
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white">{sample.label}</p>
                      <p className="mt-1 truncate text-[10px] text-zinc-500">{sample.filename}</p>
                    </div>
                    <GripVertical className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
                  </div>
                ))}
              </div>
            </div>
          </DotBackgroundDemo>
        </aside>
      </div>
    </div>
  );
}
