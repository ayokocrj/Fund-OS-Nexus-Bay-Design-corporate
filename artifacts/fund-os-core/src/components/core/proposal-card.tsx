"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCoreSession, useReviewCoreProposal, getListCoreProposalsQueryKey, type CoreProposal, type ProposalReviewInputAction } from "@workspace/api-client-react";
import { ErrorBox, StatusPill, errStatus, payloadText, payloadCitations } from "./util";

export function ProposalCard({ p, mode, onSource }: { p: CoreProposal; mode: "review" | "outbox"; onSource: (id: string) => void }) {
  const qc = useQueryClient();
  const session = useCoreSession();
  const text = payloadText(p.payload_json);
  const cites = payloadCitations(p.payload_json);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const review = useReviewCoreProposal({
    mutation: {
      onSuccess: () => { setEditing(false); },
      onSettled: (_d, err) => {
        qc.invalidateQueries({ queryKey: getListCoreProposalsQueryKey() });
        if (errStatus(err) === 409) setEditing(false);
      },
    },
  });
  const act = (action: ProposalReviewInputAction, t?: string) =>
    review.mutate({ id: p.proposal_id, data: { action, version: p.version, ...(t !== undefined ? { text: t } : {}) } });
  const editable = p.state === "proposed" && !!session.data?.review_permissions?.review;
  const canAccept = editable && !["crm_update", "document_request"].includes(p.type) && (p.type !== "fact" || !!session.data?.review_permissions?.acceptFacts);
  const canConfirm = p.state === "proposed" && !!session.data?.review_permissions?.confirmOutbox;
  const busy = review.isPending || !editable;
  const extra = Object.fromEntries(Object.entries(p.payload_json).filter(([k]) => k !== "text" && k !== "citations"));

  return (
    <article className="panel p-4" data-state={p.state} data-testid={`card-proposal-${p.proposal_id}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="tag">{p.type}</span>
        <StatusPill value={p.state} testId={`status-proposal-${p.proposal_id}`} />
        <span className="mono" style={{ color: "hsl(var(--muted))" }}>{p.proposal_id} · v{p.version} · episode {p.episode_id}</span>
        {p.reviewer_id && <span className="mono ml-auto" style={{ color: "hsl(var(--muted))" }}>reviewed by {p.reviewer_id}</span>}
      </div>
      {editing ? (
        <textarea data-testid={`input-edit-${p.proposal_id}`} className="input mt-3 w-full text-sm" rows={5} maxLength={4000} value={draft} onChange={(e) => setDraft(e.target.value)} />
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{text || <i style={{ color: "hsl(var(--muted))" }}>No text payload</i>}</p>
      )}
      {Object.keys(extra).length > 0 && <pre className="mono mt-2 overflow-x-auto text-[11px]" style={{ color: "hsl(var(--muted))" }}>{JSON.stringify(extra, null, 2)}</pre>}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="label mr-1">Evidence</span>
        {cites.length === 0 && <span className="text-xs" style={{ color: "hsl(var(--bad))" }}>No citations</span>}
        {cites.map((c) => <button key={c} className="tag underline" onClick={() => onSource(c)} data-testid={`link-citation-${c}`}>{c}</button>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "hsl(var(--line))" }}>
        {mode === "review" && (editing ? (
          <>
            <button data-testid={`button-save-${p.proposal_id}`} className="btn btn-primary" disabled={busy || !draft.trim()} onClick={() => act("edited", draft.trim())}>Save edit (v{p.version})</button>
            <button className="btn" disabled={busy} onClick={() => { setEditing(false); setDraft(text); }}>Cancel</button>
          </>
        ) : (
          <>
            <button data-testid={`button-accept-${p.proposal_id}`} className="btn btn-ok" disabled={review.isPending || !canAccept} onClick={() => act("accepted")}>Accept</button>
            <button data-testid={`button-edit-${p.proposal_id}`} className="btn" disabled={busy} onClick={() => { setDraft(text); setEditing(true); }}>Edit text</button>
            <button data-testid={`button-reject-${p.proposal_id}`} className="btn btn-bad" disabled={busy} onClick={() => act("rejected")}>Reject</button>
          </>
        ))}
        {mode === "outbox" && (
          <>
            <button data-testid={`button-confirm-${p.proposal_id}`} className="btn btn-primary" disabled={review.isPending || !canConfirm} onClick={() => act("confirmed")}>
              {p.state === "confirmed" ? "Confirmed" : "Confirm (human sign-off)"}
            </button>
            <span className="self-center text-xs" style={{ color: "hsl(var(--muted))" }}>Confirmation records approval only: adapters are absent in Phase 0.</span>
          </>
        )}
      </div>
      {review.isError && (
        <div className="mt-3"><ErrorBox error={review.error} />
          {errStatus(review.error) === 409 && <p className="mt-1 text-xs" style={{ color: "hsl(var(--muted))" }}>Latest version reloaded: review again.</p>}
        </div>
      )}
    </article>
  );
}
