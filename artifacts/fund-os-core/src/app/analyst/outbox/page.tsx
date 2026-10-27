"use client";
import { useState } from "react";
import { useListCoreProposals, getListCoreProposalsQueryKey } from "@workspace/api-client-react";
import { ErrorBox, Skeleton, Empty, PageHeader, POLL_MS } from "@/components/core/util";
import { ProposalCard } from "@/components/core/proposal-card";
import { SourceDrawer } from "@/components/core/source-drawer";

const EXTERNAL = ["crm_update", "document_request"];

export default function Page() {
  const q = useListCoreProposals({ query: { refetchInterval: POLL_MS, queryKey: getListCoreProposalsQueryKey() } });
  const [src, setSrc] = useState<string | null>(null);
  const items = (q.data ?? []).filter((p) => EXTERNAL.includes(p.type));
  const groups = items.reduce<Record<string, typeof items>>((acc, p) => { (acc[p.type] ??= []).push(p); return acc; }, {});
  return (
    <div>
      <PageHeader eyebrow="Analyst · Phase 0" title="Outbox: external actions awaiting confirmation">
        <p className="max-w-md text-xs" style={{ color: "hsl(var(--muted))" }}>
          CRM updates and document requests only. Confirmation is human-only and version-checked by the server. There is no send or apply step in Phase 0.
        </p>
      </PageHeader>
      {q.isLoading && <Skeleton rows={3} />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && items.length === 0 && <Empty title="No external proposals">Only explicit draft or extraction tools can create proposals. Asking a question cannot.</Empty>}
      <div className="space-y-8">
        {Object.entries(groups).map(([type, list]) => (
          <section key={type} data-testid={`group-${type}`}>
            <h2 className="label mb-2">{type.replace(/_/g, " ")} · {list.length}</h2>
            <div className="space-y-3">
              {list.map((p) => <ProposalCard key={`${p.proposal_id}-${p.version}`} p={p} mode="outbox" onSource={setSrc} />)}
            </div>
          </section>
        ))}
      </div>
      <SourceDrawer obsId={src} onClose={() => setSrc(null)} />
    </div>
  );
}
