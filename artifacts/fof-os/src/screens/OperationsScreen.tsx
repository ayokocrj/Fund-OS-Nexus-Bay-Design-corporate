import { Bar, Btn, Foot, Kpi, KpiRow, Panel, ScreenHead, SourceChip, Tag } from '@/components/kit';
import { useStore } from '@/state/store';
import { cn } from '@/lib/utils';
import { getManager } from '@/data/portfolio';
import { CAPITAL_CALLS, DOCS_MISSING, KYC, REG_CALENDAR } from '@/data/operations';
import { fmtK } from '@/lib/format';

export function OperationsScreen() {
  const { heldDrafts, holdDraft } = useStore();
  const bad = CAPITAL_CALLS.filter((c) => !c.ok);
  const b = bad[0];
  const bm = getManager(b.mgr);
  return (
    <div>
      <ScreenHead n={7} title="Fund operations: managers and the administrator produce, Scribe reconciles, operations decides" lead="Capital call and distribution notices from fourteen managers are recomputed against our commitment and the LPA. Missing documents and KYC files are tracked; the calendar shows what is due." />
      <KpiRow>
        <Kpi value={bad.length} label="Capital call discrepancies" detail={`${CAPITAL_CALLS.length} notices checked this month`} tone={bad.length ? 'bad' : 'ok'} />
        <Kpi value={DOCS_MISSING.length} label="Documents missing" detail="requests drafted, held" tone="warn" />
        <Kpi value={KYC.filter((k) => k[1] !== 'complete').length} label="KYC files pending" />
        <Kpi value={Math.min(...REG_CALENDAR.map((r) => r[1])) + ' days'} label="Next regulatory deadline" detail="valuation committee" />
      </KpiRow>
      <div className="grid gap-3 2xl:grid-cols-2">
        <Panel title="Capital call notices, November" aside={<span className="text-[11px] text-muted-foreground">notice vs commitment and LPA</span>}>
          <table className="tnum w-full text-[12px]">
            <thead><tr className="text-left text-[11px] text-muted-foreground"><th className="py-1 font-medium">Manager</th><th className="font-medium">Notice period</th><th className="text-right font-medium">Expected</th><th className="text-right font-medium">Notice</th><th className="pl-3 font-medium">Status</th></tr></thead>
            <tbody>
              {CAPITAL_CALLS.map((c) => (
                <tr key={c.mgr + c.call} className="border-t align-top">
                  <td className="py-1.5"><div className="font-medium">{getManager(c.mgr).name}</div><div className="text-[10.5px] text-muted-foreground">{c.call}{c.cause && ` · ${c.cause}`}</div></td>
                  <td className={cn('pt-1.5', c.given < c.lpaDays && 'font-semibold text-[hsl(var(--bad))]')}>{c.given} d (LPA {c.lpaDays})</td>
                  <td className="pt-1.5 text-right">{fmtK(c.expected)}</td>
                  <td className={cn('pt-1.5 text-right', c.notice !== c.expected && 'font-semibold text-[hsl(var(--bad))]')}>{fmtK(c.notice)}</td>
                  <td className="pl-3 pt-1.5">{c.ok ? <Tag tone="ok">ties</Tag> : <Tag tone="bad">discrepancy</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 rounded-lg border border-dashed border-[var(--sage)] bg-[#FAFDFA] p-3">
            <div className="mb-1.5 flex items-center justify-between"><span className="eyebrow">Draft, held for Operations</span><Tag tone={heldDrafts['northwind'] ? 'ok' : 'neutral'}>{heldDrafts['northwind'] ? 'in your mailbox, not sent' : 'not sent'}</Tag></div>
            <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-foreground/85">{`Subject: ${bm.name}, ${b.call}, two questions

Our recompute from the LPA gives ${fmtK(b.expected)} for our commitment share; the notice shows ${fmtK(b.notice)}. The notice also reaches us ${b.given} days before the funding date against ${b.lpaDays} in the LPA. Could the administrator confirm the calculation and the funding date?`}</pre>
            <div className="mt-2 flex flex-wrap gap-1"><SourceChip source={{ label: 'Notice, 29 Oct', doc: 'Northwind Seed capital call notice 6', loc: 'p.1' }} /><SourceChip source={{ label: 'LPA s.4.3', doc: 'Northwind Seed Fund III LPA', loc: 'Section 4.3', snip: 'not less than ten (10) Business Days' }} /></div>
            {!heldDrafts['northwind'] && <Btn className="mt-2.5" variant="primary" onClick={() => holdDraft('northwind')} data-testid="button-move-draft">Move to my mailbox as a draft</Btn>}
          </div>
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="Documents missing" aside={<span className="text-[11px] text-muted-foreground">from the vault</span>}>
            <table className="tnum w-full text-[12px]"><tbody>
              {DOCS_MISSING.map((d) => (
                <tr key={d[0] + d[1]} className="border-t first:border-0"><td className="py-1.5 font-medium">{getManager(d[0]).name}</td><td>{d[1]}</td><td className="text-right text-muted-foreground">due {d[2]}</td><td className="pl-3 text-right">{d[3] > 0 ? <Tag tone={d[3] > 30 ? 'bad' : 'warn'}>{d[3]} d late</Tag> : <Tag>upcoming</Tag>}</td></tr>
              ))}
            </tbody></table>
          </Panel>
          <Panel title="Regulatory and reporting calendar">
            <div className="space-y-2.5">
              {REG_CALENDAR.slice().sort((a, b2) => a[1] - b2[1]).map((r) => (
                <div key={r[0]} className="grid grid-cols-[1fr_64px_90px] items-center gap-3 text-[12px]">
                  <span>{r[0]}</span><span className="tnum text-right text-muted-foreground">{r[1]} days</span>
                  <div className="flex items-center gap-2"><Bar value={r[2] / 100} tone={r[2] < 40 && r[1] < 60 ? 'warn' : 'sage'} /><span className="tnum w-8 text-[11px] text-muted-foreground">{r[2]}%</span></div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="KYC and AML, managers" aside={<span className="text-[11px] text-muted-foreground">decisions by the compliance owner</span>}>
            {KYC.map((k) => (
              <div key={k[0]} className="flex items-center justify-between gap-2 border-t py-1.5 text-[12px] first:border-0"><span>{k[0]}</span>{k[1] === 'complete' ? <Tag tone="ok">complete</Tag> : <Tag tone="warn">{k[1]}</Tag>}</div>
            ))}
          </Panel>
        </div>
      </div>
      <Foot>The system never produces a notice, a NAV or a mark; it recomputes from the ledger and the agreements and shows the difference.</Foot>
    </div>
  );
}
