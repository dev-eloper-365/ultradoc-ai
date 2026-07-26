"use client";

import { useMutation } from "@tanstack/react-query";

import { askQuestion, waitForBackend } from "@/features/doc-chat/api/docApi";
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
  const setBackendWaking = useDocStore((state) => state.setBackendWaking);

  return useMutation({
    mutationFn: async (question: string) => {
      const history = toHistory(useDocStore.getState().messages);
      addMessage({ id: crypto.randomUUID(), role: "user", content: question });
      setAsking(true);
      await waitForBackend(() => setBackendWaking(true));
      setBackendWaking(false);
      return askQuestion(question, undefined, history);
    },
    onSuccess: (data) => addMessage(buildAssistantMessage(data)),
    onSettled: () => {
      setBackendWaking(false);
      setAsking(false);
    },
  });
}

/**
 * Retries the most recent question when it never got an answer — e.g. the
 * last /ask call failed (rate limit, transient network error) and the tab
 * was refreshed before retrying manually. Since chat messages persist across
 * a refresh (sessionStorage), a dangling trailing "user" message is a
 * reliable signal that a request never completed. Re-running it here doubles
 * as the rate-limit check itself: if the provider's limit has cleared, this
 * succeeds and appends the answer; if not, it fails the same way a fresh
 * question would (surfaced via the normal error toast) and can be retried
 * again on the next refresh.
 */
export function useRegenerateLastAnswer() {
  const addMessage = useDocStore((state) => state.addMessage);
  const setAsking = useDocStore((state) => state.setAsking);
  const setBackendWaking = useDocStore((state) => state.setBackendWaking);

  return useMutation({
    mutationFn: async () => {
      const messages = useDocStore.getState().messages;
      const last = messages[messages.length - 1];
      if (!last || last.role !== "user") return null;

      const history = toHistory(messages.slice(0, -1));
      setAsking(true);
      await waitForBackend(() => setBackendWaking(true));
      setBackendWaking(false);
      return askQuestion(last.content, undefined, history);
    },
    onSuccess: (data) => {
      if (data) addMessage(buildAssistantMessage(data));
    },
    onSettled: () => {
      setBackendWaking(false);
      setAsking(false);
    },
  });
}
