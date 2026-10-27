import { Link } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import { Foot, Panel, ScreenHead } from '@/components/kit';
import { useStore } from '@/state/store';
import { COMPANIES, MANAGERS, companyFlags, managerFlags } from '@/data/portfolio';
import { PROSPECTS, scoreProspect } from '@/data/managers-pipeline';
import { DILIGENCE } from '@/data/diligence';
import { CAPITAL_CALLS, DOCS_MISSING, KYC } from '@/data/operations';
import { LP_QUESTIONS } from '@/data/lp';
import { COVERAGE } from '@/data/trust';
import type { ReactNode } from 'react';

export function HomeScreen() {
  const { convs, letterUnv, lpApproved } = useStore();
  const fl = MANAGERS.filter((m) => managerFlags(m).length).length;
  const cf = COMPANIES.filter((c) => companyFlags(c).length).length;
  const tc = convs.reduce((s, c) => s + c.facts.filter((f) => f.state === 'proposed').length, 0);
  const claims = DILIGENCE.sections.flatMap((s) => s.claims);
  const rec = MANAGERS.filter((m) => m.rep.st === 'received').length;
  const unv = Object.values(letterUnv).filter(Boolean).length;
  const lp = LP_QUESTIONS.filter((q) => q.status === 'drafted' && !lpApproved[q.id]).length;
  const B = ({ children }: { children: ReactNode }) => <b className="tnum font-semibold text-foreground">{children}</b>;

  const roles: { role: string; when: string; items: ReactNode[]; links: [number, string][] }[] = [
    { role: 'Managing partner', when: 'Monday 08:30', items: [
      <><B>{fl}</B> fund positions flagged, <B>{cf}</B> direct companies flagged</>,
      <><B>{tc}</B> facts from this week's conversations waiting for a confirmation</>,
      <>Meridian Ridge Fund II: <B>{claims.filter((c) => c.s === 'con').length}</B> claims contradicted by the data room, <B>{claims.filter((c) => c.s === 'unv').length}</B> unverified</>,
      <>Q3 letter: <B>{unv}</B> figures still without a source</>,
    ], links: [[4, 'Monitor'], [3, 'Diligence'], [5, 'Letter']] },
    { role: 'Investment team', when: 'Monday 08:00', items: [
      <><B>{PROSPECTS.length}</B> managers in the pipeline, <B>{PROSPECTS.filter((p) => scoreProspect(p).band === 'meet').length}</B> above the bar</>,
      <>Reference-call questions ready for Meridian Ridge from <B>{claims.filter((c) => c.s !== 'ver').length}</B> open claims</>,
      <><B>{convs.length}</B> conversations captured and matched to a record</>,
    ], links: [[2, 'Pipeline'], [1, 'Signals']] },
    { role: 'Portfolio and LP team', when: 'Monday 09:00', items: [
      <>Q3 reports: <B>{rec} of 14</B> received, <B>{MANAGERS.filter((m) => m.rep.st === 'overdue').length}</B> overdue, <B>{MANAGERS.filter((m) => m.rep.st === 'expected').length}</B> expected by 14 Nov</>,
      <>Harbor Peak: <B>3</B> values read from a chart, waiting for a confirmation</>,
      <>LP questions: <B>{lp}</B> drafted answers waiting for approval</>,
    ], links: [[4, 'Monitor'], [6, 'LP questions']] },
    { role: 'Operations', when: 'Monday 09:30', items: [
      <>Capital call notices: <B>{CAPITAL_CALLS.length}</B> checked, <B>{CAPITAL_CALLS.filter((c) => !c.ok).length}</B> discrepancy, note drafted</>,
      <>Distribution: <B>1</B> notice without cash received after 12 days</>,
      <>Documents missing: <B>{DOCS_MISSING.length}</B>, requests drafted</>,
      <>KYC: <B>{KYC.filter((k) => k[1] !== 'complete').length}</B> files pending</>,
    ], links: [[7, 'Operations']] },
  ];

  return (
    <div>
      <ScreenHead n={0} title="The week of a fund-of-funds, by role" lead="Scribe prepares, a person decides, the log remembers. Every number on this screen is live from the other screens. Each role opens one view instead of an inbox, a CRM, fourteen PDFs and a spreadsheet." />
      <div className="grid gap-3 lg:grid-cols-2">
        {roles.map((r, i) => (
          <div key={r.role} className="rise flex flex-col rounded-xl border border-card-border bg-card p-4" style={{ animationDelay: `${i * 60}ms` }} data-testid={`card-role-${i}`}>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-[14px] font-semibold tracking-[-0.01em]">{r.role}</h3>
              <span className="text-[11px] text-muted-foreground">{r.when}</span>
            </div>
            <ul className="mb-3 flex-1 space-y-1.5 text-[12.5px] leading-snug text-muted-foreground">
              {r.items.map((it, j) => <li key={j} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--sage)]" /><span>{it}</span></li>)}
            </ul>
            <div className="flex flex-wrap gap-1.5 border-t pt-3">
              {r.links.map(([n, l]) => (
                <Link key={n} href={`/screens/${n}`} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11.5px] font-medium text-foreground/80 transition-colors hover:bg-[var(--mint)]/50 hover:text-foreground">
                  <span className="tnum text-muted-foreground">{n}</span> {l} <ArrowUpRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Panel className="mt-4" title="Process coverage" aside={<span className="text-[11px] text-muted-foreground">order fixed by where ground truth exists</span>} pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="text-left text-[11px] text-muted-foreground">{['Workflow', 'People', 'Scribe prepares', 'Measured against', 'When'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {COVERAGE.map((r) => (
                <tr key={r[0]} className="border-t align-top transition-colors hover:bg-[#F4F9F4]">
                  <td className="px-4 py-2 font-medium">{r[0]}</td><td className="px-4 py-2 text-muted-foreground">{r[1]}</td><td className="px-4 py-2">{r[2]}</td><td className="px-4 py-2 text-muted-foreground">{r[3]}</td><td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Foot>Roles follow a small fund-of-funds team; the workflows are fund diligence, startup pipeline, portfolio monitoring, LP reporting and operations, with signal capture underneath them.</Foot>
    </div>
  );
}
