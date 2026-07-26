"use client";

import { gsap } from "gsap";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { FileUploadStruc } from "@/components/shadcn-space/file-upload/file-upload-01";
import { BackgroundBeams } from "@/components/ui/background-beams";
import CheckerboardBackground from "@/components/ui/checkerboard-background";
import { Fireflies } from "@/components/ui/fireflies";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import GridSmallBackgroundDemo from "@/components/ui/grid-small-background-demo";
import Loader from "@/components/ui/loader";
import type { PanelSection } from "@/features/doc-chat/components/AskExtractSwitch";
import { AskExtractSwitch } from "@/features/doc-chat/components/AskExtractSwitch";
import { AssetsPanel } from "@/features/doc-chat/components/AssetsPanel";
import { ChatMessages } from "@/features/doc-chat/components/ChatMessages";
import { Composer } from "@/features/doc-chat/components/Composer";
import { ExtractionPanel } from "@/features/doc-chat/components/ExtractionPanel";
import { SampleDocumentsDrawer } from "@/features/doc-chat/components/SampleDocumentsDrawer";
import { useAskQuestion, useRegenerateLastAnswer } from "@/features/doc-chat/hooks/useAskQuestion";
import { useHydrateDocuments } from "@/features/doc-chat/hooks/useHydrateDocuments";
import { useUploadDocuments } from "@/features/doc-chat/hooks/useUploadDocuments";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const uploadPanelRef = useRef<HTMLDivElement>(null);
  const sidebarLogoRef = useRef<HTMLDivElement>(null);
  const sidebarLogoSlotRef = useRef<HTMLDivElement>(null);
  const observedUserMessageCountRef = useRef<number | null>(null);

  useHydrateDocuments();
  const documents = useDocStore((state) => state.documents);
  const messages = useDocStore((state) => state.messages);
  const clearConversation = useDocStore((state) => state.clearConversation);
  const reset = useDocStore((state) => state.reset);
  const isAsking = useDocStore((state) => state.isAsking);
  const { mutate: ask } = useAskQuestion();
  const { mutate: regenerateLastAnswer } = useRegenerateLastAnswer();
  const { mutate: upload, isPending: isUploading } = useUploadDocuments();
  const [activeSection, setActiveSection] = useState<PanelSection>("ask");
  const hasStoredConversation = messages.some((message) => message.role === "user");
  const [sidebarLogoDocked, setSidebarLogoDocked] = useState(hasStoredConversation);
  const [isChatScrolled, setIsChatScrolled] = useState(false);
  const sidebarLogoHasDockedRef = useRef(hasStoredConversation);

  // A refresh can land while the last question never got an answer (the
  // previous /ask call failed, e.g. a provider rate limit). Retrying it once
  // per mount doubles as the "is the limit gone yet" check — success appends
  // the answer, failure just re-surfaces the normal error toast.
  const hasRetriedPendingAnswer = useRef(false);
  useEffect(() => {
    if (hasRetriedPendingAnswer.current) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user" || isAsking) return;
    hasRetriedPendingAnswer.current = true;
    regenerateLastAnswer();
  }, [messages, isAsking, regenerateLastAnswer]);

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

  const userMessageCount = messages.filter((message) => message.role === "user").length;
  useEffect(() => {
    if (observedUserMessageCountRef.current === null) {
      observedUserMessageCountRef.current = userMessageCount;
      if (userMessageCount > 0) {
        gsap.set(sidebarLogoSlotRef.current, { height: 43 });
        gsap.set(sidebarLogoRef.current, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          clipPath: "none",
        });
      }
      return;
    }

    const previousCount = observedUserMessageCountRef.current;
    observedUserMessageCountRef.current = userMessageCount;
    if (userMessageCount <= previousCount || sidebarLogoHasDockedRef.current) return;

    const logo = sidebarLogoRef.current;
    const slot = sidebarLogoSlotRef.current;
    if (!logo || !slot) return;

    sidebarLogoHasDockedRef.current = true;
    setSidebarLogoDocked(true);
    gsap.killTweensOf([logo, slot]);
    const timeline = gsap
      .timeline()
      .set(logo, {
        autoAlpha: 1,
        x: 0,
        y: -30,
        clipPath: "none",
      })
      .to(slot, {
        height: 43,
        duration: 0.55,
        ease: "power3.out",
      })
      .to(
        logo,
        {
          y: 0,
          duration: 0.55,
          ease: "back.out(1.5)",
        },
        "<",
      );

    return () => {
      timeline.kill();
    };
  }, [userMessageCount]);

  const hasDocuments = documents.length > 0;
  useEffect(() => {
    if (hasDocuments) return;
    sidebarLogoHasDockedRef.current = false;
    setSidebarLogoDocked(false);
    gsap.set(sidebarLogoSlotRef.current, { height: 0 });
    gsap.set(sidebarLogoRef.current, { autoAlpha: 0, x: 0, y: 0, clipPath: "none" });
  }, [hasDocuments]);

  return (
    <main ref={pageRef} className="relative isolate flex h-dvh flex-col overflow-hidden">
      {(!hasDocuments || showLoader) && <BackgroundBeams className="-z-10 bg-black" />}
      {hasDocuments && !showLoader && (
        <GridSmallBackgroundDemo className="pointer-events-none absolute inset-0 z-0 h-full" />
      )}
      <div className="relative z-10 flex h-full w-full flex-col gap-2 px-2 py-3 sm:px-4 lg:px-6">
        {hasDocuments &&
          !showLoader &&
          activeSection === "ask" &&
          messages.length === 0 &&
          !isAsking && (
            <header
              ref={headerRef}
              className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center opacity-90"
            >
              <h1 className="text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
                <span className="italic">
                  <span className="text-primary">ULTRA</span>DOC
                </span>{" "}
                AI
              </h1>
              <p className="mt-2 text-sm text-zinc-500 sm:text-base">
                Your logistics Docs, minus the guesswork.
              </p>
            </header>
          )}

        {!hasDocuments || showLoader ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            <header ref={headerRef} className="text-center">
              <h1 className="text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
                <span className="italic">
                  <span className="text-primary">ULTRA</span>DOC
                </span>{" "}
                AI
              </h1>
              <p className="mt-2 text-sm text-zinc-500 sm:text-base">
                Your logistics Docs, minus the guesswork.
              </p>
            </header>
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
                <CheckerboardBackground className="rounded-[inherit]">
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
                </CheckerboardBackground>
              </div>
              {!showLoader && <SampleDocumentsDrawer />}
            </div>
          </div>
        ) : (
          <div className="relative isolate flex min-h-0 flex-1 flex-col gap-4 pt-4">
            <Fireflies className="z-0 h-full" />
            {activeSection === "ask" && isChatScrolled && (
              <div
                aria-hidden
                onMouseEnter={() => setIsChatScrolled(false)}
                className={`absolute right-0 z-30 h-14 w-10 ${
                  sidebarLogoDocked ? "top-[31px]" : "-top-3"
                }`}
              />
            )}
            <AnimatePresence>
              {activeSection === "ask" && !isChatScrolled && (
                <motion.div
                  initial={{ x: 96 }}
                  animate={{ x: 0 }}
                  exit={{ x: 96 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`group absolute right-0 z-30 transition-[top] duration-500 ${
                    sidebarLogoDocked ? "top-[38px]" : "top-[6px]"
                  }`}
                >
                  <button
                    type="button"
                    aria-label="New Conversation"
                    disabled={isAsking}
                    onClick={() => {
                      clearConversation();
                      setIsChatScrolled(false);
                    }}
                    className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black text-zinc-400 shadow-sm backdrop-blur-xl transition-[color,border-color,box-shadow] duration-300 hover:border-primary hover:text-white hover:shadow-[0_0_18px_rgba(0,183,255,0.45)] disabled:cursor-wait disabled:opacity-40"
                  >
                    <Plus
                      className="size-5 transition-[color,filter] duration-300 group-hover:text-primary group-hover:drop-shadow-[0_0_6px_rgba(0,183,255,0.9)]"
                      aria-hidden
                    />
                  </button>
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute top-full right-0 mt-2 whitespace-nowrap rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-zinc-300 opacity-0 shadow-sm backdrop-blur-xl transition-opacity group-hover:opacity-100"
                  >
                    New Conversation
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="relative z-10 flex min-h-0 flex-1 gap-4">
              <div
                className={`flex w-[7.5rem] shrink-0 flex-col transition-[margin] duration-500 ${
                  sidebarLogoDocked ? "-mt-[21px]" : "-mt-[10px]"
                }`}
              >
                <div
                  ref={sidebarLogoSlotRef}
                  className="flex h-0 w-full items-start justify-center overflow-visible pr-2 sm:pr-4 lg:pr-6"
                >
                  <div
                    ref={sidebarLogoRef}
                    aria-hidden
                    className={`pointer-events-none flex h-9 w-full items-center justify-center whitespace-nowrap text-center text-lg font-extrabold tracking-wide text-white ${
                      sidebarLogoDocked ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <span className="italic">
                      <span className="text-primary">ULTRA</span>DOC
                    </span>
                    {"\u00A0"}
                    AI
                  </div>
                </div>
                <AskExtractSwitch value={activeSection} onChange={setActiveSection} />
              </div>

              <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
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
                      <ChatMessages
                        sidebarLogoDocked={sidebarLogoDocked}
                        onScrolledChange={setIsChatScrolled}
                      />
                    ) : activeSection === "extract" ? (
                      <ExtractionPanel />
                    ) : (
                      <AssetsPanel onStartOver={reset} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            {activeSection === "ask" && <Composer onSubmit={ask} disabled={isAsking} />}
          </div>
        )}
      </div>
    </main>
  );
}
