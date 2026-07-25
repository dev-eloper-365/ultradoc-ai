"use client";

import * as m from "motion/react-m";
import { Streamdown } from "streamdown";

import { AnswerMeta } from "@/features/doc-chat/components/AnswerMeta";
import type { ChatMessage } from "@/features/doc-chat/stores/docStore";

const entrance = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const },
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <m.div className="flex flex-col items-end" {...entrance}>
        <div className="imessage-bubble imessage-from-me imessage-grouped-last">
          {message.content}
        </div>
      </m.div>
    );
  }

  const refused = message.ask?.refused;

  return (
    <m.div className="flex flex-col items-start gap-2" {...entrance}>
      <div
        className={`imessage-bubble imessage-grouped-last w-full overflow-x-auto ${
          refused
            ? "border border-amber-500/40 bg-amber-500/10 text-amber-200"
            : "imessage-from-them text-white"
        }`}
      >
        <Streamdown className="markdown-content max-w-none">{message.content}</Streamdown>
      </div>

      {message.ask && <AnswerMeta ask={message.ask} />}
    </m.div>
  );
}
