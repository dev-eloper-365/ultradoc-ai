"use client";

import { useMutation } from "@tanstack/react-query";

import { askQuestion } from "@/features/doc-chat/api/docApi";
import type { ChatMessage } from "@/features/doc-chat/stores/docStore";
import { useDocStore } from "@/features/doc-chat/stores/docStore";
import type { AskResponse, HistoryTurn } from "@/types/api";

/** Prior turns as history for the next /ask call. */
function toHistory(messages: ChatMessage[]): HistoryTurn[] {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({ role: message.role, content: message.content }));
}

function buildAssistantMessage(data: AskResponse): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: data.answer,
    ask: data,
  };
}

export function useAskQuestion() {
  const addMessage = useDocStore((state) => state.addMessage);
  const setAsking = useDocStore((state) => state.setAsking);

  return useMutation({
    mutationFn: async (question: string) => {
      const history = toHistory(useDocStore.getState().messages);
      addMessage({ id: crypto.randomUUID(), role: "user", content: question });
      setAsking(true);
      return askQuestion(question, undefined, history);
    },
    onSuccess: (data) => addMessage(buildAssistantMessage(data)),
    onSettled: () => setAsking(false),
  });
}
