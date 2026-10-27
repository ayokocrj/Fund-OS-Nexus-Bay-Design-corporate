"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Play, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  useCoreSession, useListCoreEpisodes, getListCoreEpisodesQueryKey, useVerifyCoreLedger, getVerifyCoreLedgerQueryKey,
  useRunCoreEpisode, useReplayCoreEpisode, getListCoreProposalsQueryKey, type CoreEpisode,
} from "@workspace/api-client-react";
import { ErrorBox, Skeleton, Empty, StatusPill, PageHeader, POLL_MS, errStatus } from "@/components/core/util";
import { SourceDrawer } from "@/components/core/source-drawer";

function defaultOrg(firmId: string | undefined) {
  return firmId && firmId.toLowerCase().includes("north") ? "north-org-001" : "bay-org-001";
}

export default function EpisodesPage() {
  const qc = useQueryClient();
  const session = useCoreSession();
  const episodes = useListCoreEpisodes({ query: { refetchInterval: POLL_MS, queryKey: getListCoreEpisodesQueryKey() } });
  const ledger = useVerifyCoreLedger({ query: { enabled: false, refetchOnWindowFocus: false, refetchOnReconnect: false, retry: false, queryKey: [...getVerifyCoreLedgerQueryKey(), session.data?.identity.firmId] } });
  const [orgId, setOrgId] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const org = orgId ?? defaultOrg(session.data?.identity.firmId);
  const run = useRunCoreEpisode({
    mutation: {
      onSuccess: (ep) => {
        setOpen(ep.episode_id);
        qc.invalidateQueries({ queryKey: getListCoreEpisodesQueryKey() });
        qc.invalidateQueries({ queryKey: getVerifyCoreLedgerQueryKey() });
        qc.invalidateQueries({ queryKey: getListCoreProposalsQueryKey() });
      },
    },
  });

  return (
    <div>
      <PageHeader eyebrow="Builder · Phase 0" title="Episode trace">
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); run.mutate({ data: { orgId: org } }); }}>
          <label className="text-xs">
            <div className="label mb-1">Organisation ID</div>
            <select data-testid="select-org" className="input mono" value={org} onChange={(e) => setOrgId(e.target.value)}>
              <option value="bay-org-001">bay-org-001</option>
              <option value="north-org-001">north-org-001</option>
            </select>
          </label>
          <button data-testid="button-run-episode" className="btn btn-primary" disabled={run.isPending}>
            <Play className="h-3.5 w-3.5" /> {run.isPending ? "Running mock episode…" : "Run mock episode"}
          </button>
        </form>
      </PageHeader>

      {run.isError && <div className="mb-4"><ErrorBox error={run.error} />{errStatus(run.error) === 403 && <p className="mt-1 text-xs" style={{ color: "hsl(var(--muted))" }}>Switch to a builder identity to trigger episodes, or choose your own firm's organisation.</p>}</div>}

      <section className="panel mb-6 flex flex-wrap items-center gap-4 p-4" data-testid="panel-ledger">
        <button className="btn" data-testid="button-verify-ledger" disabled={ledger.isFetching} onClick={() => ledger.refetch()}>{ledger.isFetching ? "Verifying…" : "Verify ledger now"}</button>
        {!ledger.data && !ledger.isFetching && <span className="text-xs">On demand and nightly at 02:00 UTC: incremental from the last verified hash.</span>}
        {ledger.isError && <div className="w-full"><ErrorBox error={ledger.error} onRetry={() => ledger.refetch()} /></div>}
        {ledger.data && (
          <>
            {ledger.data.valid ? <ShieldCheck className="h-5 w-5" style={{ color: "hsl(var(--ok))" }} /> : <ShieldAlert className="h-5 w-5" style={{ color: "hsl(var(--bad))" }} />}
            <div>
              <div className="font-medium" data-testid="status-ledger">{ledger.data.valid ? "Ledger hash chain verified" : "Ledger verification FAILED"}</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted))" }}><span className="mono">{ledger.data.count}</span> firm entries · {ledger.data.checked} newly checked · {ledger.data.verified_at}</div>
            </div>
            {ledger.data.failures.length > 0 && (
              <ul className="mono w-full text-xs" style={{ color: "hsl(var(--bad))" }}>{ledger.data.failures.map((f) => <li key={f}>{f}</li>)}</ul>
            )}
          </>
        )}
      </section>

      {episodes.isLoading && <Skeleton rows={4} />}
      {episodes.isError && <ErrorBox error={episodes.error} onRetry={() => episodes.refetch()} />}
      {episodes.data && episodes.data.length === 0 && <Empty title="No persisted episodes yet">Run a mock episode to write the first sequence trace.</Empty>}
      {episodes.data && episodes.data.length > 0 && (
        <div className="panel divide-y" style={{ borderColor: "hsl(var(--line))" }}>
          {episodes.data.map((ep) => (
            <EpisodeRow key={ep.episode_id} ep={ep} open={open === ep.episode_id} onToggle={() => setOpen(open === ep.episode_id ? null : ep.episode_id)} onSource={setSrc} />
          ))}
        </div>
      )}
      <SourceDrawer obsId={src} onClose={() => setSrc(null)} />
    </div>
  );
}

function EpisodeRow({ ep, open, onToggle, onSource }: { ep: CoreEpisode; open: boolean; onToggle: () => void; onSource: (id: string) => void }) {
  const replay = useReplayCoreEpisode();
  const plan = ep.plan_json ?? {};
  const summary = typeof plan.summary === "string" ? plan.summary : null;
  const tools = Array.isArray(plan.tools) ? plan.tools.map(tool => typeof tool === "string" ? tool : JSON.stringify(tool)) : [];
  const answer = plan.answer as unknown;
  const ansObj = answer && typeof answer === "object" ? (answer as Record<string, unknown>) : null;
  const ansText = typeof answer === "string" ? answer : ansObj && typeof ansObj.text === "string" ? ansObj.text : null;
  const cites = ansObj && Array.isArray(ansObj.citations) ? ansObj.citations.map(String) : [];
  const steps = [...ep.steps].sort((a, b) => a.seq - b.seq);

  return (
    <div data-testid={`row-episode-${ep.episode_id}`} style={{ borderColor: "hsl(var(--line))" }}>
      <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:opacity-90" onClick={onToggle} data-testid={`button-toggle-${ep.episode_id}`}>
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{ep.goal}</div>
          <div className="mono mt-0.5 text-[11px]" style={{ color: "hsl(var(--muted))" }}>{ep.episode_id} · {ep.skill} · {new Date(ep.started_at).toLocaleString("en-GB")}</div>
        </div>
        <StatusPill value={ep.status} />
        <span className="hidden sm:inline text-xs" style={{ color: "hsl(var(--muted))" }}>critic</span>
        <StatusPill value={ep.critic_verdict?.overall} testId={`status-critic-${ep.episode_id}`} />
        <span className="mono text-xs" title="Mock cost">cost {ep.cost}</span>
      </button>
      {open && (
        <div className="grid gap-4 px-4 pb-5 pl-11 md:grid-cols-2">
          <div className="space-y-3 text-sm">
            {ep.critic_verdict && <div className="panel p-3" data-testid="critic-checks">
              <div className="label mb-2">Critic: {ep.critic_verdict.overall}</div>
              {Object.entries(ep.critic_verdict.checks).map(([name, check]) => <div key={name} className="mb-2 text-xs"><b>{name}: {check.status}</b><p>{check.note}</p></div>)}
            </div>}
            <div className="label">Plan</div>
            {summary && <p>{summary}</p>}
            {tools.length > 0 && <div className="flex flex-wrap gap-1">{tools.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
            {typeof plan.question === "string" && <div role="alert" className="panel p-3"><b>Human review requested:</b> {plan.question}</div>}
            {Array.isArray(plan.proposalIds) && <div className="text-xs">Linked proposals: {plan.proposalIds.map(String).join(", ")}</div>}
            {ansText && (
              <div>
                <div className="label mb-1">Answer</div>
                <p className="panel p-3 leading-relaxed">{ansText}</p>
              </div>
            )}
            {cites.length > 0 && (
              <div className="flex flex-wrap gap-1">{cites.map((c) => <button key={c} className="tag underline" onClick={() => onSource(c)} data-testid={`link-citation-${c}`}>{c}</button>)}</div>
            )}
            <details className="text-xs"><summary className="cursor-pointer" style={{ color: "hsl(var(--muted))" }}>Raw plan_json</summary>
              <pre className="panel mono mt-1 max-h-64 overflow-auto p-2">{JSON.stringify(plan, null, 2)}</pre></details>
            <div className="flex flex-wrap gap-2">
              <button className="btn" disabled={replay.isPending} onClick={() => replay.mutate({ id: ep.episode_id, data: { mode: "snapshot" } })}>Check snapshot integrity</button>
              <button className="btn" disabled={replay.isPending} onClick={() => replay.mutate({ id: ep.episode_id, data: { mode: "reexecute" } })}>Re-execute with mock gateway</button>
            </div>
            {replay.isError && <ErrorBox error={replay.error} />}
            {replay.data && <pre className="panel mono max-h-80 overflow-auto p-2 text-xs" data-testid="replay-result">{JSON.stringify(replay.data, null, 2)}</pre>}
          </div>
          <div>
            <div className="label mb-2">Sequence trace ({steps.length} steps)</div>
            <ol className="space-y-1.5">
              {steps.map((s) => (
                <li key={s.step_id} className="panel grid grid-cols-[2rem_1fr] gap-x-2 p-2 text-xs" data-testid={`row-step-${s.step_id}`}>
                  <span className="mono font-semibold" style={{ color: "hsl(var(--accent))" }}>#{s.seq}</span>
                  <div>
                    <div><b>{s.kind}</b>{s.tool_name && <> · tool <span className="mono">{s.tool_name}</span></>}</div>
                    <div className="mono mt-0.5" style={{ color: "hsl(var(--muted))" }}>
                      ref {s.output_ref ?? "none"} · run {s.run_id ?? "none"}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
