import { Bar, Btn, Foot, Kpi, KpiRow, Panel, ScreenHead, SourceChip, Tag } from '@/components/kit';
import { useStore } from '@/state/store';
import { cn } from '@/lib/utils';
import { BAND_COPY, CRITERIA_VERSION, PROSPECTS, scoreProspect, type Band } from '@/data/managers-pipeline';
import { fmtM } from '@/lib/format';

const bandBg: Record<Band, string> = { meet: 'bg-[hsl(var(--ok-bg))]', review: 'bg-[hsl(var(--warn-bg))]', pass: 'bg-[hsl(var(--bad-bg))]' };
const bandFg: Record<Band, string> = { meet: 'text-[hsl(var(--ok))]', review: 'text-[hsl(var(--warn))]', pass: 'text-[hsl(var(--bad))]' };
const DEC: Record<string, string> = { advance: 'Advanced to diligence', warm: 'Kept warm', pass: 'Passed' };

export function ManagersScreen() {
  const { pipeSel, setUI, mdec, decideManager, undoManager } = useStore();
  const ranked = PROSPECTS.map((p) => ({ p, s: scoreProspect(p) })).sort((a, b) => b.s.total - a.s.total);
  const sel = PROSPECTS.find((p) => p.id === pipeSel) ?? PROSPECTS[0];
  const sc = scoreProspect(sel);
  const dec = mdec[sel.id];
  const qs = sc.gaps.map((g) => g.replace(/^Ask for /, 'Can you share ')).concat([
    'Walk us through the three investments you are proudest of and the two you regret, and what changed in the process.',
    'Who writes the first check in your pipeline today, and how many did you see last quarter?',
  ]);

  return (
    <div>
      <ScreenHead n={2} title="Manager pipeline: scored against the policy we wrote down, gaps named" lead="The criteria come from the week-one workshop, not from a deck. Scribe owns received, extracted, scored and queued. A partner owns advance, keep warm and pass." />
      <KpiRow>
        <Kpi value={PROSPECTS.length} label="Managers in the pipeline" detail="one existing manager raising, five new" />
        <Kpi value={ranked.filter((x) => x.s.band === 'meet').length} label="Above the bar (80+)" detail="bar set in week one" tone="ok" />
        <Kpi value={ranked.filter((x) => x.s.band === 'review').length} label="Partner review" detail="evidence incomplete" tone="warn" />
        <Kpi value={Object.keys(mdec).length} label="Decided this session" detail="by a partner, logged" />
      </KpiRow>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
        <Panel title="Queue" aside={<span className="text-[11px] text-muted-foreground">ranked by score</span>}>
          <div className="-mx-1 flex flex-col gap-1">
            {ranked.map(({ p, s }, i) => (
              <button key={p.id} onClick={() => setUI({ pipeSel: p.id })} data-testid={`row-prospect-${p.id}`} style={{ animationDelay: `${i * 35}ms` }}
                className={cn('rise rounded-lg border px-2.5 py-2 text-left transition-colors', p.id === sel.id ? 'border-[var(--ink-2)] bg-card ring-1 ring-[var(--ink-2)]' : 'border-transparent hover:border-border hover:bg-card')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] font-medium">{p.name}</span>
                  <span className={cn('tnum text-[16px] font-semibold tracking-[-0.02em]', bandFg[s.band])}>{s.total}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="truncate">{p.stage} · target {fmtM(p.target)}</span>
                  {mdec[p.id] ? <Tag tone="info">{DEC[mdec[p.id].v]}</Tag> : <span className="shrink-0">{p.status}</span>}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel title={sel.name} aside={<Tag>{sel.status}</Tag>}>
            <div className={cn('mb-3 flex items-center gap-4 rounded-lg px-4 py-3', bandBg[sc.band])}>
              <span className={cn('tnum text-[34px] font-semibold leading-none tracking-[-0.04em]', bandFg[sc.band])}>{sc.total}</span>
              <div>
                <div className={cn('text-[13px] font-semibold', bandFg[sc.band])}>{BAND_COPY[sc.band].t}{sc.capped && ' (capped: fund size outside policy)'}</div>
                <div className="text-[11.5px] text-foreground/70">{BAND_COPY[sc.band].s}</div>
              </div>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-3 text-[12px]">
              <div><div className="text-[11px] text-muted-foreground">GP</div>{sel.gp}</div>
              <div><div className="text-[11px] text-muted-foreground">Target, ask</div><span className="tnum">{fmtM(sel.target)}, asks {fmtM(sel.ask)}</span></div>
              <div><div className="text-[11px] text-muted-foreground">Source</div>{sel.src}</div>
            </div>
            <div className="eyebrow mb-1.5">Score against criteria {CRITERIA_VERSION}</div>
            <div className="divide-y">
              {sc.parts.map((p) => (
                <div key={p.k} className="grid grid-cols-[1fr_64px_80px] items-start gap-3 py-2 text-[12px]">
                  <div>
                    <div className="font-medium">{p.label}</div>
                    <div className="text-[11px] text-muted-foreground">{p.why}</div>
                    {p.gap && <div className="mt-0.5 text-[11px] text-[hsl(var(--warn))]">Gap: {p.gap}</div>}
                  </div>
                  <span className="tnum pt-0.5 text-right"><b>{p.pts}</b><span className="text-muted-foreground"> / {p.max}</span></span>
                  <div className="pt-1.5"><Bar value={p.pts / p.max} tone={p.pts === p.max ? 'ink' : 'sage'} /></div>
                </div>
              ))}
            </div>
            <div className="mt-2"><SourceChip source={{ label: sel.recv, doc: `${sel.name}: materials`, loc: sel.recv }} /></div>
          </Panel>

          <Panel title="Partner decision" aside={<Tag>owned by a person</Tag>}>
            {dec ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2.5">
                <div><div className="text-[13px] font-semibold">{DEC[dec.v]}</div><div className="text-[11px] text-muted-foreground">by {dec.by} · logged</div></div>
                <Btn variant="ghost" onClick={() => undoManager(sel.id)} data-testid="button-undo-decision">Reopen</Btn>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Btn variant="primary" size="md" onClick={() => decideManager(sel.id, 'advance')} data-testid="button-advance">Advance to diligence</Btn>
                <Btn size="md" onClick={() => decideManager(sel.id, 'warm')} data-testid="button-keep-warm">Keep warm</Btn>
                <Btn variant="quiet-bad" size="md" onClick={() => decideManager(sel.id, 'pass')} data-testid="button-pass">Pass</Btn>
              </div>
            )}
            <div className="eyebrow mb-1.5 mt-4">Reference-call questions</div>
            <ol className="list-decimal space-y-1 pl-4 text-[12px] leading-relaxed text-foreground/85">{qs.slice(0, 5).map((q) => <li key={q}>{q}</li>)}</ol>
          </Panel>
        </div>
      </div>
      <Foot>Criteria weights sum to 100 and change only by a signed change request with an A/B on past decisions. The same engine screens co-investments; only the criteria differ.</Foot>
    </div>
  );
}
