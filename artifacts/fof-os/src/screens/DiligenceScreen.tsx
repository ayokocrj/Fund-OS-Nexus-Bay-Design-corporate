import { Foot, Kpi, KpiRow, Panel, ScreenHead, Segmented, SourceChip } from '@/components/kit';
import { useStore } from '@/state/store';
import { cn } from '@/lib/utils';
import { CLAIM_LABEL, DILIGENCE } from '@/data/diligence';
import { mult } from '@/lib/format';

const tone = { ver: 'text-[hsl(var(--ok))]', unv: 'text-[hsl(var(--warn))]', con: 'text-[hsl(var(--bad))]' };

export function DiligenceScreen() {
  const { ddFilter, setUI } = useStore();
  const all = DILIGENCE.sections.flatMap((s) => s.claims);
  const n = { ver: all.filter((c) => c.s === 'ver').length, unv: all.filter((c) => c.s === 'unv').length, con: all.filter((c) => c.s === 'con').length };
  const tr = DILIGENCE.track;
  const cost = tr.reduce((s, r) => s + r[1], 0), val = tr.reduce((s, r) => s + r[2], 0), real = tr.reduce((s, r) => s + r[3], 0);
  const gross = (val + real) / cost;
  const net = (val + real - DILIGENCE.feeDrag.mgmt - DILIGENCE.feeDrag.carry) / cost;
  const qs = all.filter((c) => c.s !== 'ver').map((c) => c.s === 'con' ? `Your materials say "${c.c}". Our reading of the data room gives a different picture; can you reconcile?` : `Can you share evidence for "${c.c}"?`);

  return (
    <div>
      <ScreenHead n={3} title="Fund diligence: claims checked against the data room, multiples recomputed" lead="The data room is read once. Every claim in the PPM and the deck carries a status and a source. Track-record multiples are recomputed from the schedule of investments and the audited accounts. The questions write themselves from what does not tie." />
      <KpiRow>
        <Kpi value={all.length} label="Claims extracted" detail={`${DILIGENCE.docs.length} documents`} />
        <Kpi value={n.ver} label="Verified" detail="against a document" tone="ok" />
        <Kpi value={n.unv} label="Unverified" detail="no source in the room" tone="warn" />
        <Kpi value={n.con} label="Contradicted" detail="by the data room" tone="bad" />
      </KpiRow>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title={`Claims, ${DILIGENCE.manager}`} aside={<Segmented value={ddFilter} onChange={(v) => setUI({ ddFilter: v })} testid="filter-claims" options={[{ v: 'all', l: 'All' }, { v: 'ver', l: 'Verified' }, { v: 'unv', l: 'Unverified' }, { v: 'con', l: 'Contradicted' }]} />}>
          {DILIGENCE.sections.map((s) => {
            const cl = s.claims.filter((c) => ddFilter === 'all' || c.s === ddFilter);
            if (!cl.length) return null;
            return (
              <div key={s.t} className="mt-2 first:mt-0">
                <div className="eyebrow mb-1 mt-3">{s.t}</div>
                <div className="divide-y">
                  {cl.map((c, i) => (
                    <div key={c.c} className="rise grid grid-cols-[88px_1fr] gap-3 py-2 text-[12.5px]" style={{ animationDelay: `${i * 40}ms` }}>
                      <span className={cn('text-[11.5px] font-semibold', tone[c.s])}>{CLAIM_LABEL[c.s]}</span>
                      <div>
                        <div className="font-medium">{c.c}</div>
                        <div className="mt-1"><SourceChip source={{ label: c.src.length > 60 ? c.src.slice(0, 58) + '...' : c.src, doc: c.src.split(';')[0], snip: c.src, ind: c.s === 'unv' }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="Track record recomputed" aside={<span className="text-[11px] text-muted-foreground">schedule and FY2025 accounts</span>}>
            <table className="tnum w-full text-[12px]">
              <thead><tr className="text-[11px] text-muted-foreground"><th className="py-1 text-left font-medium">Position ($m)</th><th className="text-right font-medium">Cost</th><th className="text-right font-medium">Value</th><th className="text-right font-medium">Realised</th><th className="text-right font-medium">Multiple</th></tr></thead>
              <tbody>
                {tr.map((r) => (
                  <tr key={r[0]} className="border-t"><td className="py-1.5 pr-2">{r[0]}<div className="text-[10.5px] text-muted-foreground">{r[4]}</div></td><td className="text-right">{r[1].toFixed(1)}</td><td className="text-right">{r[2].toFixed(1)}</td><td className="text-right">{r[3].toFixed(1)}</td><td className="text-right font-medium">{mult((r[2] + r[3]) / r[1])}</td></tr>
                ))}
                <tr className="border-t-2 border-foreground/20 font-semibold"><td className="py-1.5">Gross</td><td className="text-right">{cost.toFixed(1)}</td><td className="text-right">{val.toFixed(1)}</td><td className="text-right">{real.toFixed(1)}</td><td className="text-right">{mult(gross)}</td></tr>
                <tr className="border-t"><td className="py-1.5 text-muted-foreground">Net of fee and carry drag</td><td colSpan={3} /><td className="text-right font-semibold text-[hsl(var(--bad))]">{mult(net)}</td></tr>
              </tbody>
            </table>
            <p className="mt-2 rounded-md bg-[hsl(var(--bad-bg))] px-2.5 py-1.5 text-[11.5px] text-[hsl(var(--bad))]">The PPM states 1.9x. Recomputed: {mult(gross)} gross, {mult(net)} net.</p>
          </Panel>
          <Panel title="Questions for the manager" aside={<span className="text-[11px] text-muted-foreground">from open claims, held as a draft</span>}>
            <ol className="list-decimal space-y-1.5 pl-4 text-[12px] leading-relaxed">{qs.map((q) => <li key={q}>{q}</li>)}</ol>
          </Panel>
          <Panel title="Data room" aside={<span className="text-[11px] text-muted-foreground">read once, indexed</span>}>
            <ul className="space-y-1 text-[12px]">{DILIGENCE.docs.map((d) => <li key={d} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[var(--sage)]" />{d}</li>)}</ul>
          </Panel>
        </div>
      </div>
      <Foot>Nothing on this screen produces a commitment recommendation, a valuation or a message to the manager.</Foot>
    </div>
  );
}
