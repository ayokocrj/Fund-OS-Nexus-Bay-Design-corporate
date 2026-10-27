import { Power } from 'lucide-react';
import { ActivityLog, Btn, Foot, Panel, ScreenHead, Segmented, Tag } from '@/components/kit';
import { useStore } from '@/state/store';
import { cn } from '@/lib/utils';
import { BUILD_OR_BUY, EVALS, LEVELS, PERMISSIONS, RULES, WHERE_IT_RUNS } from '@/data/trust';

export function HarnessScreen() {
  const { level, setLevel, pause, resume, pausedBy, blocked, log, logFilter, setUI } = useStore();
  const entries = logFilter === 'all' ? log : log.filter((e) => e.kind === logFilter);
  return (
    <div>
      <ScreenHead n={9} title="What Scribe may do, and what it never does" lead="Six rules checked in code before any action, an autonomy level earned by weekly results and lost in one click, and a set of past examples the firm owns to measure every change." />

      <div className={cn('mb-3 flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3.5', level === 0 ? 'border-[hsl(var(--bad)/0.3)] bg-[hsl(var(--bad-bg))]' : 'border-card-border bg-[var(--ink)] text-[var(--pale-2)]')}>
        <Power className={cn('h-5 w-5', level === 0 ? 'text-[hsl(var(--bad))]' : 'text-[var(--mint)]')} />
        <div className="flex-1">
          <div className="text-[14px] font-semibold">{level === 0 ? `Scribe is paused${pausedBy ? ' by ' + pausedBy : ''}` : 'Kill switch'}</div>
          <div className={cn('text-[12px]', level === 0 ? 'text-foreground/70' : 'text-[var(--pale)]/70')}>{level === 0 ? 'Reading and logging continue. No drafts, no proposals.' : 'Any partner can stop all drafting and proposing at once. Resuming is logged.'}</div>
        </div>
        {level === 0 ? <Btn variant="primary" size="md" onClick={resume} data-testid="button-resume">Resume at L3</Btn> : <button onClick={pause} data-testid="button-pause" className="h-9 rounded-lg bg-[var(--mint)] px-4 text-[13px] font-semibold text-[var(--ink)] transition-transform active:translate-y-px">Pause Scribe</button>}
      </div>

      <div className="grid gap-3 2xl:grid-cols-2">
        <Panel title="Autonomy level, this firm" aside={<span className="text-[11px] text-muted-foreground">lowering is instant; raising needs a signed request</span>}>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {LEVELS.map((l, i) => (
              <button key={l.n} onClick={() => setLevel(i)} data-testid={`button-level-${i}`}
                className={cn('rounded-lg border px-3 py-2.5 text-left transition-colors', level === i ? 'border-[var(--ink-2)] bg-card ring-1 ring-[var(--ink-2)]' : 'border-border bg-card/60 hover:border-[var(--sage)]')}>
                <div className="flex items-center gap-2 text-[12.5px] font-semibold"><span className={cn('tnum rounded px-1 text-[10.5px]', level === i ? 'bg-[var(--ink)] text-[var(--mint)]' : 'bg-secondary text-muted-foreground')}>L{i}</span>{l.n}</div>
                <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{l.d}</div>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Permissions, in plain words">
          <div className="divide-y">
            {PERMISSIONS.map((p) => (
              <div key={p[0]} className="grid grid-cols-[110px_1fr_auto] items-start gap-3 py-2 text-[12px]">
                <span className={cn('font-semibold', p[2] === 'Never' && 'text-[hsl(var(--bad))]')}>{p[0]}</span>
                <span className="text-muted-foreground">{p[1]}</span>
                <Tag tone={p[2] === 'Never' ? 'bad' : p[2] === 'Always' ? 'ok' : 'neutral'}>{p[2]}</Tag>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-3" title="Six rules, checked before every action" aside={<Tag>a single breach stops the pilot</Tag>}>
        <div className="divide-y">
          {RULES.map(([no, r], i) => (
            <div key={no} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-2 text-[12.5px]">
              <span className="tnum font-semibold text-[var(--sage)]">{no}</span>
              <span>{r}</span>
              <span className={cn('tnum text-[11px]', i === 0 && blocked ? 'font-semibold text-[hsl(var(--bad))]' : 'text-muted-foreground')}>{i === 0 ? blocked : 0} blocked</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-3 grid gap-3 2xl:grid-cols-2">
        <Panel title="Measured against the firm's own examples" aside={<span className="text-[11px] text-muted-foreground">synthetic</span>}>
          <table className="tnum w-full text-[12px]">
            <thead><tr className="text-left text-[11px] text-muted-foreground"><th className="py-1 font-medium">Check</th><th className="font-medium">Examples</th><th className="text-right font-medium">Bar</th><th className="text-right font-medium">Now</th></tr></thead>
            <tbody>{EVALS.map((e) => <tr key={e[0]} className="border-t align-top"><td className="py-1.5 pr-2">{e[0]}</td><td className="pr-2 text-muted-foreground">{e[1]}</td><td className="text-right text-muted-foreground">{e[2]}</td><td className="pl-2 text-right font-semibold">{e[3]}</td></tr>)}</tbody>
          </table>
        </Panel>
        <Panel title="Activity, tamper-evident" aside={<Segmented value={logFilter} onChange={(v) => setUI({ logFilter: v })} testid="filter-log" options={[{ v: 'all', l: 'All' }, { v: 'system', l: 'Scribe' }, { v: 'partner', l: 'People' }, { v: 'blocked', l: 'Blocked' }]} />}>
          <ActivityLog entries={entries} max={14} />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 2xl:grid-cols-2">
        <Panel title="Where it runs" aside={<Tag tone="info">inside the firm's stack</Tag>}>
          {WHERE_IT_RUNS.map(([k, v]) => <div key={k} className="grid grid-cols-[130px_1fr] gap-3 border-t py-1.5 text-[12px] first:border-0"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>)}
        </Panel>
        <Panel title="Build or buy" aside={<span className="text-[11px] text-muted-foreground">the layer nobody sells</span>}>
          <table className="w-full text-[12px]">
            <thead><tr className="text-left text-[11px] text-muted-foreground"><th className="py-1 font-medium">Need</th><th className="font-medium">Buy or keep</th><th className="font-medium">Build</th></tr></thead>
            <tbody>{BUILD_OR_BUY.map((r) => <tr key={r[0]} className="border-t align-top"><td className="py-1.5 pr-2 font-medium">{r[0]}</td><td className="pr-2 text-muted-foreground">{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
          </table>
        </Panel>
      </div>
      <Foot>Check counts and evaluation figures are synthetic; in the pilot they are computed from the firm's exported notes and reports in week one.</Foot>
    </div>
  );
}
