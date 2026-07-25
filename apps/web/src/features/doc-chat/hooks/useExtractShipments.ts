"use client";

import { useMutation } from "@tanstack/react-query";

import { extractShipments } from "@/features/doc-chat/api/docApi";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

export function useExtractShipments() {
  const documents = useDocStore((state) => state.documents);
  const setExtractions = useDocStore((state) => state.setExtractions);
  const setExtracting = useDocStore((state) => state.setExtracting);

  return useMutation({
    mutationFn: async () => {
      setExtracting(true);
      return extractShipments(documents.map((doc) => doc.document_id));
    },
    onSuccess: (results) => setExtractions(results),
    onSettled: () => setExtracting(false),
  });
}
