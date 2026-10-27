import { Btn, Field, Foot, Kpi, KpiRow, Panel, ScreenHead, Segmented, Sparkline, Tag } from '@/components/kit';
import { useStore } from '@/state/store';
import { cn } from '@/lib/utils';
import { COMPANIES, FLAG_ADVICE, HARBOR_CHART_VALUES, MANAGERS, VINTAGE_MEDIANS, companyFlags, getCompany, getManager, managerFlags, totals } from '@/data/portfolio';
import { fmtK, fmtM, mult, pct } from '@/lib/format';

export function MonitorScreen() {
  const { layer, pfSel, coSel, pfFilter, setUI, chartOk, confirmChart } = useStore();
  const rec = MANAGERS.filter((m) => m.rep.st === 'received').length;
  const fl = MANAGERS.filter((m) => managerFlags(m).length);
  const cfl = COMPANIES.filter((c) => companyFlags(c).length);
  let rows = MANAGERS.map((m) => ({ m, f: managerFlags(m) }));
  if (pfFilter === 'flag') rows = rows.filter((r) => r.f.length);

  return (
    <div>
      <ScreenHead n={4} title="Monitoring, two layers: fourteen funds and eight companies in one schema" lead="Quarterly reports from managers and monthly updates from companies are parsed into the same table. Collection becomes exception handling: the team opens the flags on Monday, not fourteen PDFs." />
      <KpiRow>
        <Kpi value={`${rec} / 14`} label="Q3 reports received" detail={`${MANAGERS.filter((m) => m.rep.st === 'overdue').length} overdue, ${MANAGERS.filter((m) => m.rep.st === 'expected').length} expected by 14 Nov`} />
        <Kpi value={`${fl.length} + ${cfl.length}`} label="Flags, funds + companies" detail="raised the day a report lands" tone="warn" />
        <Kpi value={fmtM(totals.nav)} label="NAV of fund positions" detail="as reported, 30 Sep" />
        <Kpi value={pct(totals.paidIn / totals.commit)} label="Paid in / committed" detail={`${fmtM(totals.paidIn)} of ${fmtM(totals.commit)}`} />
      </KpiRow>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented value={layer} onChange={(v) => setUI({ layer: v })} testid="toggle-layer" options={[{ v: 'funds', l: 'Funds (14)' }, { v: 'companies', l: 'Direct companies (8)' }]} />
        {layer === 'funds' && <Segmented value={pfFilter} onChange={(v) => setUI({ pfFilter: v })} testid="filter-flags" options={[{ v: 'all', l: 'All' }, { v: 'flag', l: `Flagged (${fl.length})` }]} />}
      </div>

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel pad={false} title={layer === 'funds' ? 'Fund positions, Q3 2026' : 'Direct companies, October updates'} aside={<span className="text-[11px] text-muted-foreground">click a row for detail</span>}>
          <div className="overflow-x-auto">
            {layer === 'funds' ? (
              <table className="tnum w-full text-[12px]">
                <thead><tr className="text-left text-[11px] text-muted-foreground">{['Manager', 'Report', 'NAV', 'TVPI', 'DPI', 'Flags'].map((h, i) => <th key={h} className={cn('whitespace-nowrap px-3 py-2 font-medium', i >= 2 && i <= 4 && 'text-right')}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(({ m, f }, i) => (
                    <tr key={m.id} onClick={() => setUI({ pfSel: m.id })} data-testid={`row-manager-${m.id}`} style={{ animationDelay: `${i * 25}ms` }}
                      className={cn('rise cursor-pointer border-t transition-colors', m.id === pfSel ? 'bg-[#E9F3EA]' : 'hover:bg-[#F4F9F4]')}>
                      <td className="min-w-[160px] whitespace-nowrap px-3 py-1.5"><div className="font-medium">{m.name}</div><div className="text-[10.5px] text-muted-foreground">{m.fund} · {m.vint}</div></td>
                      <td className="px-3">{m.rep.st === 'received' ? <Tag tone="ok">day {m.rep.day}</Tag> : m.rep.st === 'expected' ? <Tag>due {m.rep.due}</Tag> : <Tag tone="bad">overdue {m.rep.days}d</Tag>}</td>
                      <td className="px-3 text-right">{fmtM(m.nav)}</td>
                      <td className={cn('px-3 text-right', m.tvpiComp !== m.tvpiRep && 'font-semibold text-[hsl(var(--bad))]')}>{mult(m.tvpiRep)}</td>
                      <td className="px-3 text-right">{mult(m.dpi)}</td>
                      <td className="px-3">{f.length ? <div className="flex flex-wrap gap-1">{f.slice(0, 2).map((x) => <Tag key={x.k} tone={x.tone}>{x.s}</Tag>)}{f.length > 2 && <Tag>+{f.length - 2}</Tag>}</div> : <span className="text-muted-foreground">none</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="tnum w-full text-[12px]">
                <thead><tr className="text-left text-[11px] text-muted-foreground">{['Company', 'Update', 'ARR', 'MoM', 'Runway', 'Flags'].map((h, i) => <th key={h} className={cn('whitespace-nowrap px-3 py-2 font-medium', i >= 2 && i <= 4 && 'text-right')}>{h}</th>)}</tr></thead>
                <tbody>
                  {COMPANIES.map((c, i) => {
                    const f = companyFlags(c);
                    return (
                      <tr key={c.id} onClick={() => setUI({ coSel: c.id })} data-testid={`row-company-${c.id}`} style={{ animationDelay: `${i * 25}ms` }}
                        className={cn('rise cursor-pointer border-t transition-colors', c.id === coSel ? 'bg-[#E9F3EA]' : 'hover:bg-[#F4F9F4]')}>
                        <td className="px-3 py-1.5"><div className="font-medium">{c.name}</div><div className="text-[10.5px] text-muted-foreground">{c.stage} · {c.sector}</div></td>
                        <td className="px-3">{c.update.st === 'received' ? <Tag tone="ok">day {c.update.day}</Tag> : <Tag tone="bad">missing</Tag>}</td>
                        <td className="px-3 text-right">{fmtK(c.arr)}</td>
                        <td className="px-3 text-right">{pct(c.growth, 1)}</td>
                        <td className={cn('px-3 text-right', c.runway < 9 && 'font-semibold text-[hsl(var(--bad))]')}>{c.runway.toFixed(1)} mo</td>
                        <td className="px-3">{f.length ? <div className="flex flex-wrap gap-1">{f.map((x) => <Tag key={x.k} tone={x.tone}>{x.s}</Tag>)}</div> : <span className="text-muted-foreground">none</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        <div className="flex flex-col gap-3">
          {layer === 'funds' ? <FundDetail id={pfSel} chartOk={chartOk} confirmChart={confirmChart} /> : <CompanyDetail id={coSel} />}
          <Panel title="Vintage group medians" aside={<span className="text-[11px] text-muted-foreground">same table, no manual pull</span>}>
            <table className="tnum w-full text-[12px]">
              <thead><tr className="text-[11px] text-muted-foreground"><th className="py-1 text-left font-medium">Vintage</th><th className="text-right font-medium">TVPI</th><th className="text-right font-medium">DPI</th><th className="text-right font-medium">Called</th></tr></thead>
              <tbody>{VINTAGE_MEDIANS.map((g) => <tr key={g.group} className="border-t"><td className="py-1.5 font-medium">{g.group} <span className="font-normal text-muted-foreground">({g.n})</span></td><td className="text-right">{mult(g.tvpi)}</td><td className="text-right">{mult(g.dpi)}</td><td className="text-right">{pct(g.called)}</td></tr>)}</tbody>
            </table>
          </Panel>
        </div>
      </div>
      <Foot>Flag rules: TVPI headline differing from components by 0.03x or more; report overdue against the LPA; key-person change confirmed in a conversation and absent from the report; top position above 30% of NAV; documents missing; distribution notice without cash after 10 days; capital call outside the LPA.</Foot>
    </div>
  );
}

function FundDetail({ id, chartOk, confirmChart }: { id: string; chartOk: Record<string, boolean>; confirmChart: (k: string) => void }) {
  const m = getManager(id);
  const f = managerFlags(m);
  return (
    <Panel title={m.name} aside={<Tag>{m.fund} · {m.vint}</Tag>}>
      <div className="mb-1 text-[11px] text-muted-foreground">NAV, last six quarters ($m)</div>
      <Sparkline data={m.hist} />
      <div className="mt-2">
        <Field k="NAV" src={{ label: 'Q3 report, table p.4', doc: `${m.name} Q3 2026 report`, loc: 'Table p.4' }}>{fmtM(m.nav)}</Field>
        <Field k="Paid in" src={{ label: 'Fund ledger, capital calls', doc: 'Fund ledger', loc: `${m.name} capital calls` }}>{fmtM(m.paidIn)} of {fmtM(m.commit)} ({pct(m.called)})</Field>
        <Field k="TVPI / DPI">{mult(m.tvpiRep)} net reported{m.tvpiComp !== m.tvpiRep && <> · components {mult(m.tvpiComp)}</>} / {mult(m.dpi)}</Field>
        <Field k="Strategy">{m.strat}</Field>
        <Field k="GP">{m.gp}</Field>
        <Field k="Last contact">{m.last}</Field>
      </div>
      <div className="eyebrow mb-1.5 mt-3">Flags</div>
      {f.length ? f.map((x) => (
        <div key={x.k} className="mb-1.5 flex flex-wrap items-center gap-2"><Tag tone={x.tone}>{x.t}</Tag><span className="text-[11px] text-muted-foreground">{FLAG_ADVICE[x.k]}</span></div>
      )) : <p className="text-[12px] text-muted-foreground">No flag this quarter.</p>}
      {m.id === 'm02' && (
        <>
          <div className="eyebrow mb-1.5 mt-3">Read from charts, waiting for a confirmation</div>
          {HARBOR_CHART_VALUES.map((x) => (
            <div key={x.k} className="flex items-center justify-between gap-2 border-t py-1.5 text-[12px]">
              <span>{x.label}: <b className="tnum">{x.value}</b> <span className="text-[11px] text-muted-foreground">{x.loc}</span></span>
              {chartOk[x.k] ? <Tag tone="ok">confirmed</Tag> : <Btn onClick={() => confirmChart(x.k)} data-testid={`button-confirm-chart-${x.k}`}>Confirm against PDF</Btn>}
            </div>
          ))}
        </>
      )}
    </Panel>
  );
}

function CompanyDetail({ id }: { id: string }) {
  const c = getCompany(id);
  const f = companyFlags(c);
  return (
    <Panel title={c.name} aside={<Tag>{c.stage} · via {getManager(c.via).name}</Tag>}>
      <div className="mb-1 text-[11px] text-muted-foreground">ARR, last seven months ($k)</div>
      <Sparkline data={c.hist} />
      <div className="mt-2">
        <Field k="ARR" src={{ label: 'Update Oct 2026, field "ARR"', doc: `${c.name} founder update, October 2026`, loc: 'Field ARR' }}>{fmtK(c.arr)}</Field>
        <Field k="Growth">{pct(c.growth, 1)} month on month</Field>
        <Field k="Burn" src={{ label: 'Update Oct 2026, field "Net burn"', doc: `${c.name} founder update, October 2026`, loc: 'Field Net burn' }}>{fmtK(c.burn)} a month</Field>
        <Field k="Cash, runway">{fmtK(c.cash)}, {c.runway.toFixed(1)} months</Field>
      </div>
      <div className="eyebrow mb-1.5 mt-3">Flags</div>
      {f.length ? f.map((x) => <div key={x.k} className="mb-1.5 flex flex-wrap items-center gap-2"><Tag tone={x.tone}>{x.t}</Tag><span className="text-[11px] text-muted-foreground">{FLAG_ADVICE[x.k]}</span></div>) : <p className="text-[12px] text-muted-foreground">No flag this month.</p>}
    </Panel>
  );
}
