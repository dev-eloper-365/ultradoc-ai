import { apiClient } from "@/lib/api/client";
import type {
  AskResponse,
  DocumentSummary,
  ExtractResult,
  HistoryTurn,
  UploadBatchItem,
} from "@/types/api";

export async function listDocuments(): Promise<DocumentSummary[]> {
  const { data } = await apiClient.get<{ documents: DocumentSummary[] }>("/documents");
  return data.documents;
}

export async function uploadDocuments(files: File[]): Promise<UploadBatchItem[]> {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  const { data } = await apiClient.post<{ results: UploadBatchItem[] }>("/upload/batch", formData);
  return data.results;
}

export async function askQuestion(
  question: string,
  documentIds?: string[],
  history?: HistoryTurn[],
): Promise<AskResponse> {
  const { data } = await apiClient.post<AskResponse>("/ask", {
    question,
    document_ids: documentIds && documentIds.length > 0 ? documentIds : null,
    history: history && history.length > 0 ? history : null,
  });
  return data;
}

export async function extractShipments(documentIds?: string[]): Promise<ExtractResult[]> {
  const { data } = await apiClient.post<{ results: ExtractResult[] }>("/extract", {
    document_ids: documentIds && documentIds.length > 0 ? documentIds : null,
  });
  return data.results;
}
