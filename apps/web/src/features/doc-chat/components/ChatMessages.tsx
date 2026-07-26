"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef } from "react";
import { ThinkingOrb } from "thinking-orbs";

import { MessageBubble } from "@/features/doc-chat/components/MessageBubble";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

export function ChatMessages({
  sidebarLogoDocked = false,
  onScrolledChange,
}: {
  sidebarLogoDocked?: boolean;
  onScrolledChange?: (isScrolled: boolean) => void;
}) {
  const messages = useDocStore((state) => state.messages);
  const isAsking = useDocStore((state) => state.isAsking);
  const isBackendWaking = useDocStore((state) => state.isBackendWaking);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);
  const lastReportedScrollRef = useRef(false);

  // New turns always move into view after React and Motion have laid them out.
  // Depending on the message array (not only its length) also supports future
  // streamed updates where the last assistant message grows in place.
  // biome-ignore lint/correctness/useExhaustiveDependencies: these state changes intentionally trigger scrolling after the updated chat DOM is committed
  useEffect(() => {
    shouldFollowRef.current = true;
    const frame = requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, isAsking, isBackendWaking]);

  // Continue following a response as its rendered content becomes taller.
  // Scrolling upward opts out until the user returns near the bottom or a new
  // turn is added.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reattach when the first message mounts the previously absent content container
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (!shouldFollowRef.current) return;
      const scroller = scrollRef.current;
      scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "auto" });
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [messages.length]);

  if (messages.length === 0 && !isAsking) {
    return <div className="flex-1" />;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const target = event.currentTarget;
        shouldFollowRef.current = target.scrollHeight - target.scrollTop - target.clientHeight < 80;
        const isScrolled = target.scrollTop > 12;
        if (isScrolled !== lastReportedScrollRef.current) {
          lastReportedScrollRef.current = isScrolled;
          onScrolledChange?.(isScrolled);
        }
      }}
      className={`no-scrollbar flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-1 pb-4 ${
        sidebarLogoDocked ? "pt-24" : "pt-16"
      }`}
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0, black 20px)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 20px)",
      }}
    >
      <div ref={contentRef} className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isBackendWaking && (
            <MessageBubble
              key="backend-waking"
              message={{
                id: "backend-waking",
                role: "assistant",
                content: "Kindly wait for few seconds, while render is firing up",
              }}
            />
          )}
        </AnimatePresence>
        {isAsking && !isBackendWaking && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 pl-2"
          >
            <ThinkingOrb
              state="composing"
              size={64}
              theme="dark"
              style={{ width: 42, height: 42 }}
              aria-hidden
            />
            <span className="text-[20px] font-semibold text-zinc-500">UltraDoc is thinking...</span>
          </m.div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
