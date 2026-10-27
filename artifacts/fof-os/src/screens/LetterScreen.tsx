import { Btn, FigureChip, Foot, Panel, ScreenHead, Tag } from '@/components/kit';
import { useStore, type Source } from '@/state/store';
import { MANAGERS, managerFlags, totals } from '@/data/portfolio';
import { fmtM, median, mult, pct } from '@/lib/format';

const SRC: Record<string, Source> = {
  l1: { label: 'NAV, 14 positions', doc: 'Fund ledger and manager reports, 30 Sep 2026', loc: 'NAV by position, 14 lines', snip: 'Sum of reported NAV across fund positions; marks as provided by the managers and the administrator.', by: 'Operations (demo)' },
  l2: { label: 'Holdings register', doc: 'Fund ledger', loc: 'Holdings as of 30 Sep 2026', by: 'Operations (demo)' },
  l3: { label: 'Capital calls, Q3', doc: 'Fund ledger, capital calls', loc: 'Q3 2026, 6 calls', by: 'Operations (demo)' },
  l4: { label: 'Distributions', doc: 'Fund ledger, distributions', loc: 'Inception to 30 Sep 2026', by: 'Operations (demo)' },
  l6: { label: 'Monitoring flags', doc: 'Monitoring schema, Q3', loc: 'Flag register', by: 'Portfolio and LP (demo)' },
  l8: { label: 'Successor funds', doc: 'Signal capture, confirmed facts', loc: 'Oct and Nov 2026', by: 'Associate (demo)' },
};

const UNV: { k: 'a' | 'b' | 'c'; t: string; note: string }[] = [
  { k: 'a', t: 'Look-through company count, 212', note: 'Three managers have not sent their Q3 portfolio lists. Use the eleven that did and footnote, or wait.' },
  { k: 'b', t: 'Median TVPI across reporting managers', note: 'Uses manager-reported TVPI, including Harbor Peak\u2019s disputed headline. Attach the monitoring table as source.' },
  { k: 'c', t: 'Capital called as a share of commitments', note: 'Ledger figure; administrator reconciliation for Q3 not yet attached.' },
];

export function LetterScreen() {
  const { letterUnv: u, letterAgent, setLetterAgent, letterApproved, approveLetter, resolveLetter } = useStore();
  const unv = Object.values(u).filter(Boolean).length;
  const flagged = MANAGERS.filter((m) => managerFlags(m).length).length;

  return (
    <div>
      <ScreenHead n={5} title="LP letter: drafted from the same table, every figure with its source" lead="Each figure points to a row in the ledger, the schema or the register. A figure without a source blocks approval. Performance marks come from the administrator. The letter is a draft; approving it sends nothing." />
      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Quarterly letter, Q3 2026, draft 1" aside={unv ? <Tag tone="warn">{unv} figure{unv > 1 ? 's' : ''} without a source</Tag> : <Tag tone="ok">all figures sourced</Tag>}>
          <article className="max-w-[64ch] space-y-3.5 rounded-lg border bg-[#FCFEFC] px-6 py-5 text-[13.5px] leading-[1.75] text-foreground/90" data-testid="text-letter">
            <p>Dear partners,</p>
            <p>The fund closed the third quarter with <FigureChip source={SRC.l1}>{fmtM(totals.nav)} of net asset value across its fund positions</FigureChip> and <FigureChip source={SRC.l2}>fourteen fund positions and eight direct companies</FigureChip>. During the quarter we funded <FigureChip source={SRC.l3}>six capital calls for {fmtM(4.1)}</FigureChip> and received distributions from two managers.</p>
            <p><FigureChip unresolved={u.a} source={SRC.l2}>Look-through, our positions hold 212 underlying companies</FigureChip>; <FigureChip unresolved={u.b} source={SRC.l1}>median TVPI across reporting managers stands at {mult(median(MANAGERS.map((m) => m.tvpiRep)))}</FigureChip>. <FigureChip source={SRC.l6}>{flagged} positions</FigureChip> carry an open flag this quarter; each has a named owner and a next step.</p>
            {letterAgent && (
              <p className="rise -mx-3 rounded-md border-l-2 border-[var(--sage)] bg-[#EEF7EF] px-3 py-1">
                <span className="eyebrow mr-1 text-[var(--sage)]">Drafted by Scribe, for your edit</span><br />
                Among our managers, <FigureChip source={SRC.l8}>four</FigureChip> have started conversations about a successor fund; we are in diligence on one of them. <FigureChip source={SRC.l6}>One manager</FigureChip> has told us of a change in its general partner team, which we are reviewing against the key-person provisions of its agreement.
              </p>
            )}
            <p><FigureChip unresolved={u.c} source={SRC.l3}>Capital called to date stands at {pct(totals.paidIn / totals.commit)} of commitments</FigureChip>, with <FigureChip source={SRC.l4}>{fmtM(totals.dist)} distributed to date</FigureChip>. As always, no message to a manager, a founder or a limited partner leaves the firm without a partner.</p>
            <p>With our thanks for your continued trust,<br />The team</p>
          </article>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Btn variant="primary" size="md" disabled={unv > 0 || letterApproved} onClick={approveLetter} data-testid="button-approve-letter">{letterApproved ? 'Approved by Partner (demo)' : 'Approve for partner review'}</Btn>
            {!letterAgent && <Btn size="md" onClick={() => setLetterAgent(true)} data-testid="button-draft-paragraph">Draft manager developments paragraph</Btn>}
            {letterAgent && <Btn variant="ghost" size="md" onClick={() => setLetterAgent(false)} data-testid="button-remove-paragraph">Remove Scribe's paragraph</Btn>}
            <span className="text-[11px] text-muted-foreground">{unv ? 'Approval is blocked until every figure has a source.' : letterApproved ? 'Placed in the partners\u2019 review folder. Not sent.' : 'Ready for approval.'}</span>
          </div>
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="Figures to resolve" aside={<span className="text-[11px] text-muted-foreground">click any figure to see its source</span>}>
            <div className="divide-y">
              {UNV.map((x) => (
                <div key={x.k} className="grid grid-cols-[1fr_auto] items-start gap-3 py-2.5 text-[12px]">
                  <div><div className="font-medium">{x.t}</div><div className="text-[11px] leading-relaxed text-muted-foreground">{x.note}</div></div>
                  {u[x.k] ? <Btn onClick={() => resolveLetter(x.k)} data-testid={`button-resolve-${x.k}`}>Attach source</Btn> : <Tag tone="ok">resolved</Tag>}
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Fund figures, same table">
            <table className="tnum w-full text-[12px]"><tbody>
              {[['NAV of fund positions', fmtM(totals.nav)], ['Paid in to managers', fmtM(totals.paidIn)], ['Commitments', fmtM(totals.commit)], ['Distributed to date', fmtM(totals.dist)]].map(([k, v]) => (
                <tr key={k} className="border-t first:border-0"><td className="py-1.5 text-muted-foreground">{k}</td><td className="text-right font-semibold">{v}</td></tr>
              ))}
            </tbody></table>
          </Panel>
        </div>
      </div>
      <Foot>Net performance by vintage, DPI and TVPI at the fund level are produced by the administrator and are inputs here, never computed by the system.</Foot>
    </div>
  );
}
