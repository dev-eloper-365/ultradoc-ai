export interface UploadResponse {
  document_id: string;
  filename: string;
  pages: number;
  chunk_count: number;
  status: string;
}

export interface UploadBatchItem {
  filename: string;
  document: UploadResponse | null;
  error: string | null;
}

export interface DocumentSummary {
  document_id: string;
  filename: string;
  pages: number;
  chunk_count: number;
  uploaded_at: string;
}

export interface Source {
  text: string;
  page: number;
  chunk_index: number;
  score: number;
  document_id: string;
  filename: string;
}

export type ConfidenceTier = "high" | "medium" | "low";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ConfidenceBreakdown {
  retrieval: number;
  agreement: number;
  grounding: number;
}

export interface AskResponse {
  answer: string;
  refused: boolean;
  sources: Source[];
  confidence: number;
  confidence_tier: ConfidenceTier;
  confidence_breakdown: ConfidenceBreakdown;
  model: string;
}

export interface ShipmentExtraction {
  reference_id: string | null;
  pickup_location: string | null;
  delivery_location: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  po_number: string | null;
  commodity: string | null;
  weight: number | null;
  quantity: string | null;
  equipment_type: string | null;
  rate: number | null;
  currency: string | null;
  carrier_name: string | null;
}

export interface ExtractResult {
  document_id: string;
  filename: string;
  data: ShipmentExtraction | null;
  error: string | null;
}
