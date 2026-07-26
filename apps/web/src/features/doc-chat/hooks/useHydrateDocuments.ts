"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { listDocuments } from "@/features/doc-chat/api/docApi";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

/** Restores previously uploaded documents (persisted on the backend) into the
 * store on mount, so a page refresh doesn't lose the document tray. */
export function useHydrateDocuments() {
  const setDocuments = useDocStore((state) => state.setDocuments);
  const documentsInStore = useDocStore((state) => state.documents);
  const [hasReconciled, setHasReconciled] = useState(false);
  const query = useQuery({ queryKey: ["documents"], queryFn: listDocuments });

  // The backend is authoritative. Render's ephemeral filesystem can be reset
  // while this tab's sessionStorage still contains the old document IDs.
  // Replacing the saved list prevents preview requests for files that no
  // longer exist after an instance restart.
  useEffect(() => {
    if (!query.data) {
      if (query.isError) setHasReconciled(true);
      return;
    }
    setDocuments(
      query.data.map((doc) => ({
        document_id: doc.document_id,
        filename: doc.filename,
        pages: doc.pages,
        chunk_count: doc.chunk_count,
        status: "ready",
      })),
    );
    setHasReconciled(true);
  }, [query.data, query.isError, setDocuments]);

  return {
    ...query,
    isReconcilingStoredDocuments: documentsInStore.length > 0 && !hasReconciled,
  };
}
