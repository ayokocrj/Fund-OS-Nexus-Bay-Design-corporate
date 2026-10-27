import { Btn, Foot, Kpi, KpiRow, ScreenHead, SourceChip, Tag } from '@/components/kit';
import { useStore } from '@/state/store';
import { LP_QUESTIONS } from '@/data/lp';

export function LpQuestionsScreen() {
  const { lpApproved, approveLp } = useStore();
  const drafted = LP_QUESTIONS.filter((q) => q.status === 'drafted');
  return (
    <div>
      <ScreenHead n={6} title="LP question desk: answered from the record, approved by a person" lead="Every answer carries its citations. A question whose answer belongs to the administrator is routed, not guessed. Approving places the answer in the IR mailbox as a draft; nothing is sent by the system." />
      <KpiRow>
        <Kpi value={LP_QUESTIONS.length} label="Questions this month" />
        <Kpi value={drafted.length} label="Drafted from the record" detail="median 9 minutes to draft" />
        <Kpi value={LP_QUESTIONS.filter((q) => q.status === 'routed').length} label="Routed" detail="figure belongs to the administrator" tone="warn" />
        <Kpi value={Object.keys(lpApproved).length} label="Approved this session" tone="ok" />
      </KpiRow>
      <div className="flex flex-col gap-2.5">
        {LP_QUESTIONS.map((q, i) => (
          <article key={q.id} className="rise rounded-xl border border-card-border bg-card p-4" style={{ animationDelay: `${i * 50}ms` }} data-testid={`card-lpq-${q.id}`}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Tag>{q.lp}</Tag>
              <span className="text-[11px] text-muted-foreground">{q.received}</span>
              <span className="ml-auto">{q.status === 'routed' ? <Tag tone="warn">routed to the CFO</Tag> : lpApproved[q.id] ? <Tag tone="ok">approved, in IR drafts</Tag> : <Tag tone="info">draft</Tag>}</span>
            </div>
            <h3 className="text-[14px] font-semibold leading-snug tracking-[-0.01em]">{q.q}</h3>
            {q.ans ? (
              <p className="mt-2 border-l-2 border-[var(--mint)] pl-3 text-[12.5px] leading-relaxed text-foreground/85">{q.ans}</p>
            ) : (
              <p className="mt-2 rounded-lg bg-[hsl(var(--warn-bg))] px-3 py-2 text-[12px] text-[hsl(var(--warn))]">{q.route}</p>
            )}
            {q.cites.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">{q.cites.map((c) => <SourceChip key={c} source={{ label: c, doc: c }} />)}</div>
            )}
            {q.status === 'drafted' && !lpApproved[q.id] && (
              <div className="mt-3 flex gap-2 border-t pt-3">
                <Btn variant="primary" onClick={() => approveLp(q.id)} data-testid={`button-approve-${q.id}`}>Approve answer</Btn>
                <span className="self-center text-[11px] text-muted-foreground">Placed in the IR mailbox as a draft. A person sends it.</span>
              </div>
            )}
          </article>
        ))}
      </div>
      <Foot>In production the answers cite documents in the vault and figures in the schema; the administrator's figures are never recomputed by the system.</Foot>
    </div>
  );
}
