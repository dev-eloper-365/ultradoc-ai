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
  /** Sorted document-id signature used for the latest extraction attempt. */
  extractionDocumentKey: string;
  /** Changes only when the user fully resets the document session. */
  promptPlaceholderIndex: number;
  isAsking: boolean;
  isBackendWaking: boolean;
  isExtracting: boolean;
  addDocuments: (documents: UploadResponse[]) => void;
  setDocuments: (documents: UploadResponse[]) => void;
  removeDocument: (documentId: string) => void;
  addMessage: (message: ChatMessage) => void;
  clearConversation: () => void;
  setAsking: (isAsking: boolean) => void;
  setBackendWaking: (isBackendWaking: boolean) => void;
  setExtractions: (
    results: { document_id: string; data: ShipmentExtraction | null; error: string | null }[],
  ) => void;
  markExtractionAttempt: (documentKey: string) => void;
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
      extractionDocumentKey: "",
      promptPlaceholderIndex: 0,
      isAsking: false,
      isBackendWaking: false,
      isExtracting: false,
      addDocuments: (documents) =>
        set((state) => {
          const existingIds = new Set(state.documents.map((doc) => doc.document_id));
          const newDocs = documents.filter((doc) => !existingIds.has(doc.document_id));
          if (newDocs.length === 0) return state;
          return {
            documents: [...state.documents, ...newDocs],
            extractions: {},
            extractErrors: {},
            extractionDocumentKey: "",
          };
        }),
      setDocuments: (documents) =>
        set((state) => {
          const currentKey = state.documents
            .map((doc) => doc.document_id)
            .sort()
            .join(",");
          const nextKey = documents
            .map((doc) => doc.document_id)
            .sort()
            .join(",");
          if (currentKey === nextKey) return { documents };
          return {
            documents,
            extractions: {},
            extractErrors: {},
            extractionDocumentKey: "",
          };
        }),
      removeDocument: (documentId) =>
        set((state) => {
          const documents = state.documents.filter((doc) => doc.document_id !== documentId);
          if (documents.length === state.documents.length) return state;
          return {
            documents,
            extractions: {},
            extractErrors: {},
            extractionDocumentKey: "",
          };
        }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      clearConversation: () =>
        set({
          messages: [],
          isAsking: false,
          isBackendWaking: false,
        }),
      setAsking: (isAsking) => set({ isAsking }),
      setBackendWaking: (isBackendWaking) => set({ isBackendWaking }),
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
      markExtractionAttempt: (extractionDocumentKey) => set({ extractionDocumentKey }),
      setExtracting: (isExtracting) => set({ isExtracting }),
      reset: () =>
        set((state) => ({
          documents: [],
          messages: [],
          extractions: {},
          extractErrors: {},
          extractionDocumentKey: "",
          promptPlaceholderIndex: (state.promptPlaceholderIndex + 1) % 5,
          isAsking: false,
          isBackendWaking: false,
          isExtracting: false,
        })),
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
        extractionDocumentKey: state.extractionDocumentKey,
        promptPlaceholderIndex: state.promptPlaceholderIndex,
      }),
    },
  ),
);
