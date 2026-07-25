"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { listDocuments } from "@/features/doc-chat/api/docApi";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

/** Restores previously uploaded documents (persisted on the backend) into the
 * store on mount, so a page refresh doesn't lose the document tray. */
export function useHydrateDocuments() {
  const setDocuments = useDocStore((state) => state.setDocuments);
  const documentsInStore = useDocStore((state) => state.documents);
  const query = useQuery({ queryKey: ["documents"], queryFn: listDocuments });

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when query.data changes; including documentsInStore would clobber docs added after hydration
  useEffect(() => {
    if (!query.data || documentsInStore.length > 0) return;
    setDocuments(
      query.data.map((doc) => ({
        document_id: doc.document_id,
        filename: doc.filename,
        pages: doc.pages,
        chunk_count: doc.chunk_count,
        status: "ready",
      })),
    );
  }, [query.data, setDocuments]);

  return query;
}
