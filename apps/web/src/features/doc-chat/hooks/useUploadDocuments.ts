"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { uploadDocuments } from "@/features/doc-chat/api/docApi";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

export function useUploadDocuments() {
  const addDocuments = useDocStore((state) => state.addDocuments);

  return useMutation({
    mutationFn: uploadDocuments,
    onSuccess: (results) => {
      const succeeded = results.flatMap((item) => (item.document ? [item.document] : []));
      if (succeeded.length > 0) addDocuments(succeeded);

      for (const item of results) {
        if (item.error) toast.error(`${item.filename}: ${item.error}`);
      }
    },
  });
}
