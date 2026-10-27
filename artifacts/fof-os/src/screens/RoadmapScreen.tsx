import { Foot, Panel, ScreenHead } from '@/components/kit';
import { CADENCE, GATES, HANDOVER, PHASES } from '@/data/trust';

const WEEKS = 30;

export function RoadmapScreen() {
  return (
    <div>
      <ScreenHead n={11} title="The two months, and what comes after: one workflow at a time" lead="The initial engagement is the pilot. It starts where the firm's own data already exists, its conversations and its managers' reports, runs in shadow mode first, and ends in a number. Each later phase is paid for by the previous read-out." />
      <Panel title="Plan, weeks 1 to 30" aside={<span className="text-[11px] text-muted-foreground">gates are signed by a partner</span>}>
        <div className="overflow-x-auto scroll-quiet">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[230px_1fr] text-[10.5px] text-muted-foreground">
              <div />
              <div className="relative h-6">
                <div className="absolute inset-y-0 left-0 flex items-center rounded-t-md bg-[var(--mint)]/45 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]" style={{ width: `${(8 / WEEKS) * 100}%` }}>The two months</div>
              </div>
              <div />
              <div className="flex">{Array.from({ length: WEEKS }, (_, i) => <div key={i} className="tnum flex-1 border-l border-border/60 py-1 text-center">{i % 2 === 0 ? `W${i + 1}` : ''}</div>)}</div>
            </div>
            {PHASES.map((p, i) => (
              <div key={p.n} className="grid grid-cols-[230px_1fr] items-center border-t border-border/60">
                <div className="truncate py-2 pr-3 text-[12px] font-medium">{p.n}</div>
                <div className="relative h-8">
                  <div className="absolute inset-y-0 left-0 bg-[var(--mint)]/15" style={{ width: `${(8 / WEEKS) * 100}%` }} />
                  <div className="rise absolute top-1.5 flex h-5 origin-left items-center rounded-[5px] px-2 text-[10.5px] font-medium text-white"
                    style={{ left: `${((p.a - 1) / WEEKS) * 100}%`, width: `${((p.b - p.a + 1) / WEEKS) * 100}%`, background: p.tone, color: i >= 7 ? 'var(--ink)' : 'var(--pale-2)', animationDelay: `${i * 50}ms` }}>
                    <span className="truncate">{p.label}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[230px_1fr] border-t">
              <div className="py-2 text-[11px] text-muted-foreground">Gates</div>
              <div className="relative h-10">
                {GATES.map(([w, l]) => (
                  <div key={l} className="absolute top-1.5 -translate-x-1/2 text-center" style={{ left: `${(w / WEEKS) * 100}%` }}>
                    <div className="mx-auto h-2.5 w-2.5 rotate-45 bg-[var(--ink)]" />
                    <div className="mt-1 whitespace-nowrap text-[10px] font-medium">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="mt-3" title="Exit criterion per phase" aside={<span className="text-[11px] text-muted-foreground">signed before the next phase starts</span>}>
        <div className="divide-y">
          {PHASES.map((p) => (
            <div key={p.n} className="grid grid-cols-[minmax(0,220px)_70px_1fr] gap-3 py-2 text-[12px]">
              <span className="flex items-center gap-2 font-medium"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: p.tone }} />{p.n}</span>
              <span className="tnum text-muted-foreground">W{p.a} to {p.b}</span>
              <span>{p.exit}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-3 grid gap-3 2xl:grid-cols-2">
        <Panel title="Cadence">
          {CADENCE.map(([k, v]) => <div key={k} className="grid grid-cols-[150px_1fr] gap-3 border-t py-1.5 text-[12px] first:border-0"><span className="font-medium">{k}</span><span className="text-muted-foreground">{v}</span></div>)}
        </Panel>
        <Panel title="Handover checklist, per workflow">
          <ul className="space-y-1.5 text-[12px]">{HANDOVER.map((h) => <li key={h} className="flex gap-2"><span className="mt-[3px] h-3 w-3 shrink-0 rounded-[3px] border border-[var(--sage)]" />{h}</li>)}</ul>
        </Panel>
      </div>
      <Foot>Durations are planning ranges; the exact calendar is set at kickoff against the firm's quarter end and reporting deadlines.</Foot>
    </div>
  );
}
