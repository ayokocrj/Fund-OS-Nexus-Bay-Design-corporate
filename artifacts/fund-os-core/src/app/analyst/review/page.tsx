"use client";
import { useState } from "react";
import { useListCoreProposals, useListCoreEpisodes, getListCoreProposalsQueryKey } from "@workspace/api-client-react";
import { ErrorBox, Skeleton, Empty, PageHeader, POLL_MS } from "@/components/core/util";
import { ProposalCard } from "@/components/core/proposal-card";
import { SourceDrawer } from "@/components/core/source-drawer";

export default function Page() {
  const episodes = useListCoreEpisodes();
  const q = useListCoreProposals({ query: { refetchInterval: POLL_MS, queryKey: getListCoreProposalsQueryKey() } });
  const [src, setSrc] = useState<string | null>(null);
  const items = q.data ?? [];
  const groups = items.reduce<Record<string, typeof items>>((acc, p) => { (acc[p.type] ??= []).push(p); return acc; }, {});
  return (
    <div>
      <PageHeader eyebrow="Analyst · Phase 0" title="Proposal review">
        <p className="max-w-md text-xs" style={{ color: "hsl(var(--muted))" }}>
          All persisted proposals, grouped by type. Accept, edit or reject: each action is version-checked by the server against the current record.
        </p>
      </PageHeader>
      {episodes.data?.filter(episode => episode.plan_json.sourceFlagged).map(episode => <article key={episode.episode_id} className="panel mb-3 p-4" data-testid="source-review-flag">
        <b>Human source review required</b><p className="mono text-xs">{episode.episode_id}</p>
        <p className="text-sm">Untrusted instructions detected: this Ask created no business proposal.</p>
        {Array.isArray(episode.plan_json.flaggedObservations) && episode.plan_json.flaggedObservations.map(id => <button key={String(id)} className="tag underline" onClick={() => setSrc(String(id))}>{String(id)}</button>)}
      </article>)}
      {q.isLoading && <Skeleton rows={3} />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && items.length === 0 && <Empty title="No proposals to review">Only explicit draft or extraction requests create business proposals.</Empty>}
      <div className="space-y-8">
        {Object.entries(groups).map(([type, list]) => (
          <section key={type} data-testid={`group-${type}`}>
            <h2 className="label mb-2">{type.replace(/_/g, " ")} · {list.length}</h2>
            <div className="space-y-3">
              {list.map((p) => <ProposalCard key={`${p.proposal_id}-${p.version}`} p={p} mode="review" onSource={setSrc} />)}
            </div>
          </section>
        ))}
      </div>
      <SourceDrawer obsId={src} onClose={() => setSrc(null)} />
    </div>
  );
}
