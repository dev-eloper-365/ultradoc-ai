"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AskResponse, ShipmentExtraction, UploadResponse } from "@/types/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ask?: AskResponse;
}

interface DocState {
  /** Every document uploaded so far (persists across chat turns). */
  documents: UploadResponse[];
  messages: ChatMessage[];
  /** Extraction results keyed by document_id, so switching documents doesn't
   * lose previously extracted data. */
  extractions: Record<string, ShipmentExtraction>;
  extractErrors: Record<string, string>;
  isAsking: boolean;
  isExtracting: boolean;
  addDocuments: (documents: UploadResponse[]) => void;
  setDocuments: (documents: UploadResponse[]) => void;
  removeDocument: (documentId: string) => void;
  addMessage: (message: ChatMessage) => void;
  setAsking: (isAsking: boolean) => void;
  setExtractions: (
    results: { document_id: string; data: ShipmentExtraction | null; error: string | null }[],
  ) => void;
  setExtracting: (isExtracting: boolean) => void;
  reset: () => void;
}

export const useDocStore = create<DocState>()(
  persist(
    (set) => ({
      documents: [],
      messages: [],
      extractions: {},
      extractErrors: {},
      isAsking: false,
      isExtracting: false,
      addDocuments: (documents) =>
        set((state) => {
          const existingIds = new Set(state.documents.map((doc) => doc.document_id));
          const newDocs = documents.filter((doc) => !existingIds.has(doc.document_id));
          return { documents: [...state.documents, ...newDocs] };
        }),
      setDocuments: (documents) => set({ documents }),
      removeDocument: (documentId) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.document_id !== documentId),
        })),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      setAsking: (isAsking) => set({ isAsking }),
      setExtractions: (results) =>
        set((state) => {
          const extractions = { ...state.extractions };
          const extractErrors = { ...state.extractErrors };
          for (const result of results) {
            if (result.data) {
              extractions[result.document_id] = result.data;
              delete extractErrors[result.document_id];
            } else if (result.error) {
              extractErrors[result.document_id] = result.error;
            }
          }
          return { extractions, extractErrors };
        }),
      setExtracting: (isExtracting) => set({ isExtracting }),
      reset: () =>
        set({
          documents: [],
          messages: [],
          extractions: {},
          extractErrors: {},
        }),
    }),
    {
      // sessionStorage, not localStorage — matches the X-Session-Id lifetime
      // (lib/session.ts): survives a page refresh, dies with the tab, never
      // leaks one browser session's chat into a different session's fresh
      // document scope. The only in-session clear is the "Start over" button.
      name: "ultradoc-doc-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        documents: state.documents,
        messages: state.messages,
        extractions: state.extractions,
        extractErrors: state.extractErrors,
      }),
    },
  ),
);
