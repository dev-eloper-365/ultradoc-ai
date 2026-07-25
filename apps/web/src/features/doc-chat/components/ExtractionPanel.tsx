"use client";

import { AlertTriangle, Calendar, Copy, FileText, MapPin, Truck } from "lucide-react";
import { useState } from "react";

import { useExtractShipments } from "@/features/doc-chat/hooks/useExtractShipments";
import { useDocStore } from "@/features/doc-chat/stores/docStore";
import type { ShipmentExtraction, UploadResponse } from "@/types/api";

function fmt(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function ShipmentCard({ data }: { data: ShipmentExtraction }) {
  const stats: [string, string][] = [
    ["Commodity", fmt(data.commodity)],
    ["Weight", data.weight === null ? "—" : `${data.weight.toLocaleString()} lb`],
    ["Quantity", fmt(data.quantity)],
    ["Equipment", fmt(data.equipment_type)],
  ];

  return (
    <div className="p-4">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
        <div className="min-w-0">
          <p className="mb-0.5 text-xs text-zinc-500">Reference ID</p>
          <p className="truncate font-mono text-base font-medium text-white">
            {fmt(data.reference_id)}
          </p>
        </div>
        <div className="size-3.5" aria-hidden />
        <div className="min-w-0">
          <p className="mb-0.5 flex items-center gap-1 text-xs text-zinc-500">
            <Truck className="size-3.5 shrink-0" aria-hidden />
            Carrier
          </p>
          <p className="truncate text-sm font-medium text-white">{fmt(data.carrier_name)}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
        <div>
          <p className="mb-0.5 flex items-center gap-1 text-xs text-zinc-500">
            <MapPin className="size-3" aria-hidden />
            Pickup
          </p>
          <p className="mb-0.5 text-xs leading-snug text-white">{fmt(data.pickup_location)}</p>
          <p className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Calendar className="size-2.5" aria-hidden />
            {fmt(data.pickup_date)}
          </p>
        </div>
        <div className="size-3.5" aria-hidden />
        <div>
          <p className="mb-0.5 flex items-center gap-1 text-xs text-zinc-500">
            <MapPin className="size-3" aria-hidden />
            Delivery
          </p>
          <p className="mb-0.5 text-xs leading-snug text-white">{fmt(data.delivery_location)}</p>
          <p className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Calendar className="size-2.5" aria-hidden />
            {fmt(data.delivery_date)}
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-black/20 px-2.5 py-2 backdrop-blur-md">
            <p className="mb-0.5 text-[11px] text-zinc-500">{label}</p>
            <p className="truncate text-xs font-medium text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
        <div>
          <p className="mb-0.5 text-xs text-zinc-500">PO number</p>
          <p className="font-mono text-xs text-white">{fmt(data.po_number)}</p>
        </div>
        <div className="shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-right">
          <p className="mb-0.5 text-[10px] text-emerald-400">Rate</p>
          <p className="text-sm font-medium text-emerald-400">
            {data.rate === null
              ? "—"
              : `${data.currency && data.currency !== "USD" ? `${data.currency} ` : "$"}${data.rate.toFixed(2)}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function JsonBlock({ data }: { data: ShipmentExtraction }) {
  const json = JSON.stringify(data, null, 2);
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative p-5">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(json);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-black/20 px-2 py-1 text-xs text-zinc-400 backdrop-blur-md hover:text-white"
      >
        <Copy className="size-3" />
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="whitespace-pre-wrap break-words overflow-x-hidden font-mono text-xs text-zinc-300">
        {json}
      </pre>
    </div>
  );
}

function FieldsJsonToggle({
  value,
  onChange,
}: {
  value: "fields" | "json";
  onChange: (value: "fields" | "json") => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-black/20 p-0.5 text-xs backdrop-blur-md">
      <button
        type="button"
        onClick={() => onChange("fields")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          value === "fields" ? "bg-primary text-white" : "text-zinc-400 hover:text-white"
        }`}
      >
        Fields
      </button>
      <button
        type="button"
        onClick={() => onChange("json")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          value === "json" ? "bg-primary text-white" : "text-zinc-400 hover:text-white"
        }`}
      >
        JSON
      </button>
    </div>
  );
}

export function ExtractionPanel() {
  const documents = useDocStore((state) => state.documents);
  const extractions = useDocStore((state) => state.extractions);
  const extractErrors = useDocStore((state) => state.extractErrors);
  const { mutate, isPending } = useExtractShipments();

  if (documents.length === 0) return null;

  const hasAnyResult = documents.some(
    (doc) => extractions[doc.document_id] || extractErrors[doc.document_id],
  );

  return (
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-4">
      {!hasAnyResult && (
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isPending}
          className="self-start rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          {isPending
            ? "Extracting..."
            : `Extract shipment fields (${documents.length} doc${documents.length === 1 ? "" : "s"})`}
        </button>
      )}
      {hasAnyResult && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {documents.map((doc) => (
            <ExtractionCard
              key={doc.document_id}
              document={doc}
              data={extractions[doc.document_id]}
              error={extractErrors[doc.document_id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExtractionCard({
  document,
  data,
  error,
}: {
  document: UploadResponse;
  data: ShipmentExtraction | undefined;
  error: string | undefined;
}) {
  const [view, setView] = useState<"fields" | "json">("fields");

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
          <p className="truncate text-xs font-medium text-zinc-400">{document.filename}</p>
        </div>
        {data && <FieldsJsonToggle value={view} onChange={setView} />}
      </div>

      {error && (
        <div className="m-4 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}
      {data && (view === "fields" ? <ShipmentCard data={data} /> : <JsonBlock data={data} />)}
    </div>
  );
}
