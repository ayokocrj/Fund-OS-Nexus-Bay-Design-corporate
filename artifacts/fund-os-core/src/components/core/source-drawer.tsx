"use client";
import { X } from "lucide-react";
import { useGetCoreSource, getGetCoreSourceQueryKey } from "@workspace/api-client-react";
import { ErrorBox, Skeleton } from "./util";

export function SourceDrawer({ obsId, onClose }: { obsId: string | null; onClose: () => void }) {
  const q = useGetCoreSource(obsId ?? "", { query: { enabled: !!obsId, queryKey: getGetCoreSourceQueryKey(obsId ?? "") } });
  if (!obsId) return null;
  const s = q.data;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "hsl(var(--ink) / .25)" }} onClick={onClose}>
      <aside data-testid="panel-source" className="h-full w-full max-w-lg overflow-y-auto p-6" style={{ background: "hsl(var(--panel))" }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="label">Evidence source · synthetic</div>
            <div className="mono mt-1 text-sm">{obsId}</div>
          </div>
          <button data-testid="button-close-source" className="btn" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        {q.isLoading && <Skeleton rows={2} />}
        {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
        {s && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-[110px_1fr] gap-y-1.5">
              <dt className="label">Observation</dt><dd className="mono" data-testid="text-source-obs">{s.obs_id}</dd>
              <dt className="label">Document</dt><dd className="mono">{s.doc_id ?? "none"}</dd>
              <dt className="label">Modality</dt><dd className="mono">{s.modality} <span className="tag ml-1">deterministic mock</span></dd>
            </dl>
            <div>
              <div className="label mb-1">Text</div>
              <p data-testid="text-source-body" className="panel whitespace-pre-wrap p-3 leading-relaxed">{s.text}</p>
            </div>
            <div>
              <div className="label mb-1">Locator</div>
              <pre className="panel mono overflow-x-auto p-3 text-xs">{JSON.stringify(s.locator_json, null, 2)}</pre>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
