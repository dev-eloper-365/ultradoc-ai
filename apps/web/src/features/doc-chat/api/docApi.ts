import { apiClient } from "@/lib/api/client";
import type {
  AskResponse,
  DocumentSummary,
  ExtractResult,
  HistoryTurn,
  UploadBatchItem,
} from "@/types/api";

const HEALTH_PROBE_TIMEOUT_MS = 2500;
const HEALTH_POLL_INTERVAL_MS = 3000;
const BACKEND_WAKE_TIMEOUT_MS = 120_000;

async function backendIsHealthy(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), HEALTH_PROBE_TIMEOUT_MS);

  try {
    // Probe through our same-origin Next.js route. Render can emit its own
    // headerless 502 while a free instance wakes or a deploy switches over;
    // calling it directly from the browser makes that infrastructure response
    // look like an application CORS failure.
    const response = await fetch("/api/backend-health", {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { status?: string };
    return data.status === "ok";
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Render's free tier can take 50+ seconds to wake. Probe quickly, notify the
 * caller only when a cold start is detected, then keep polling long enough for
 * the queued request to continue automatically once the service is available.
 */
export async function waitForBackend(onWaking: () => void = () => undefined): Promise<void> {
  if (await backendIsHealthy()) return;

  onWaking();
  const deadline = Date.now() + BACKEND_WAKE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, HEALTH_POLL_INTERVAL_MS));
    if (await backendIsHealthy()) return;
  }

  throw new Error("The document service is still starting. Please try again in a moment.");
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  await waitForBackend();
  const { data } = await apiClient.get<{ documents: DocumentSummary[] }>("/documents");
  return data.documents;
}

export async function uploadDocuments(files: File[]): Promise<UploadBatchItem[]> {
  await waitForBackend();
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
  await waitForBackend();
  const { data } = await apiClient.post<{ results: ExtractResult[] }>("/extract", {
    document_ids: documentIds && documentIds.length > 0 ? documentIds : null,
  });
  return data.results;
}

export async function getDocumentFile(documentId: string): Promise<Blob> {
  await waitForBackend();
  const { data } = await apiClient.get<Blob>(`/documents/${documentId}/file`, {
    responseType: "blob",
  });
  return data;
}
