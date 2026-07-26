"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef } from "react";

import { WaveSpinnerSquare } from "@/components/shared/WaveSpinnerSquare";
import { MessageBubble } from "@/features/doc-chat/components/MessageBubble";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

export function ChatMessages() {
  const messages = useDocStore((state) => state.messages);
  const isAsking = useDocStore((state) => state.isAsking);
  const isBackendWaking = useDocStore((state) => state.isBackendWaking);
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-runs on message/asking/backend-wake changes to scroll to the newest content, even though the effect body doesn't read those values
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isAsking, isBackendWaking]);

  if (messages.length === 0 && !isAsking) {
    return <div className="flex-1" />;
  }

  return (
    <div
      className="no-scrollbar flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-1 py-4"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0, black 20px)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 20px)",
      }}
    >
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
          <WaveSpinnerSquare size={14} />
          <span className="text-xs text-zinc-500">UltraDoc is thinking...</span>
        </m.div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
