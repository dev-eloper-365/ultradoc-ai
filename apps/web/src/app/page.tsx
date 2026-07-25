"use client";

import { gsap } from "gsap";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { FileUploadStruc } from "@/components/shadcn-space/file-upload/file-upload-01";
import { BackgroundBeams } from "@/components/ui/background-beams";
import DotBackgroundDemo from "@/components/ui/dot-background-demo";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import Loader from "@/components/ui/loader";
import type { PanelSection } from "@/features/doc-chat/components/AskExtractSwitch";
import { AskExtractSwitch } from "@/features/doc-chat/components/AskExtractSwitch";
import { ChatMessages } from "@/features/doc-chat/components/ChatMessages";
import { Composer } from "@/features/doc-chat/components/Composer";
import { DocumentTray } from "@/features/doc-chat/components/DocumentTray";
import { ExtractionPanel } from "@/features/doc-chat/components/ExtractionPanel";
import { SampleDocumentsDrawer } from "@/features/doc-chat/components/SampleDocumentsDrawer";
import { useAskQuestion } from "@/features/doc-chat/hooks/useAskQuestion";
import { useHydrateDocuments } from "@/features/doc-chat/hooks/useHydrateDocuments";
import { useUploadDocuments } from "@/features/doc-chat/hooks/useUploadDocuments";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const uploadPanelRef = useRef<HTMLDivElement>(null);

  useHydrateDocuments();
  const documents = useDocStore((state) => state.documents);
  const reset = useDocStore((state) => state.reset);
  const isAsking = useDocStore((state) => state.isAsking);
  const { mutate: ask } = useAskQuestion();
  const { mutate: upload, isPending: isUploading } = useUploadDocuments();
  const [activeSection, setActiveSection] = useState<PanelSection>("ask");

  // Local uploads can resolve in well under 100ms, which flashes the loader
  // for an imperceptible instant. Hold it visible for a minimum stretch once
  // shown so the user actually sees upload feedback.
  const MIN_LOADER_MS = 600;
  const [showLoader, setShowLoader] = useState(false);
  const loaderShownAt = useRef<number | null>(null);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      const header = headerRef.current;
      const uploadPanel = uploadPanelRef.current;
      if (!header || !uploadPanel) return;

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(header.children, {
            autoAlpha: 0,
            y: 18,
            duration: 0.65,
            stagger: 0.1,
          })
          .from(
            uploadPanel,
            {
              autoAlpha: 0,
              y: 28,
              scale: 0.97,
              duration: 0.8,
            },
            "-=0.35",
          );
      });
    }, pageRef);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  useEffect(() => {
    if (isUploading) {
      loaderShownAt.current = Date.now();
      setShowLoader(true);
      return;
    }
    if (!showLoader) return;
    const elapsed = Date.now() - (loaderShownAt.current ?? 0);
    const timer = setTimeout(() => setShowLoader(false), Math.max(MIN_LOADER_MS - elapsed, 0));
    return () => clearTimeout(timer);
  }, [isUploading, showLoader]);

  const hasDocuments = documents.length > 0;

  return (
    <main ref={pageRef} className="relative isolate flex h-dvh flex-col overflow-hidden">
      {(!hasDocuments || showLoader) && <BackgroundBeams className="-z-10" />}
      {hasDocuments && !showLoader && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[url('/backgrounds/glass-slats-4.jpg')] bg-cover bg-center"
        />
      )}
      <div className="relative z-10 flex h-full w-full flex-col gap-2 px-2 py-3 sm:px-4 lg:px-6">
        <header ref={headerRef} className="pt-2">
          <h1 className="text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
            <span className="italic">
              <span className="text-primary">ULTRA</span>DOC
            </span>{" "}
            AI
          </h1>
          <p className="mt-2 text-base text-zinc-500 sm:text-lg">
            Upload logistics documents, ask questions, and extract shipment data.
          </p>
        </header>

        {!hasDocuments || showLoader ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex w-full max-w-6xl items-center justify-center">
              <div
                ref={uploadPanelRef}
                className="relative w-full max-w-3xl rounded-3xl border border-dashed border-white/15 bg-white/5 backdrop-blur-2xl"
              >
                <GlowingEffect
                  spread={120}
                  glow
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={2}
                  className="z-50"
                />
                <DotBackgroundDemo className="rounded-[inherit]">
                  {showLoader ? (
                    <div className="flex min-h-[248px] items-center justify-center p-6">
                      <Loader />
                    </div>
                  ) : (
                    <FileUploadStruc
                      onChange={(files) => {
                        if (files.length > 0 && !isUploading) upload(files);
                      }}
                    />
                  )}
                </DotBackgroundDemo>
              </div>
              {!showLoader && <SampleDocumentsDrawer />}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-4">
            <DocumentTray onStartOver={reset} />

            <AskExtractSwitch value={activeSection} onChange={setActiveSection} />

            <div className="flex min-h-0 flex-1 flex-col">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full min-h-0 flex-col"
                >
                  {activeSection === "ask" ? (
                    <div className="flex h-full min-h-0 flex-col gap-3">
                      <ChatMessages />
                      <Composer onSubmit={ask} disabled={isAsking} />
                    </div>
                  ) : (
                    <ExtractionPanel />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
