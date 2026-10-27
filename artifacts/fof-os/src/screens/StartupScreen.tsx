import { Btn, Foot, Kpi, KpiRow, Panel, ScreenHead, Tag } from '@/components/kit';
import { useStore } from '@/state/store';
import { cn } from '@/lib/utils';
import { DEALS } from '@/data/operations';
import { fmtM } from '@/lib/format';

const LABEL: Record<string, string> = { take: 'Take allocation', pass: 'Pass', more: 'More information' };

export function StartupScreen() {
  const { dealDec, decideDeal } = useStore();
  const tone = (s: number) => (s >= 70 ? 'text-[hsl(var(--ok))]' : s >= 50 ? 'text-[hsl(var(--warn))]' : 'text-[hsl(var(--bad))]');
  return (
    <div>
      <ScreenHead n={8} title="Startup pipeline: co-investments scored with the same engine, decided by a partner" lead="Not the centre of this role, so kept light. Allocations offered by our managers are scored against the written co-invest policy; gaps are named; a partner decides." />
      <KpiRow>
        <Kpi value={DEALS.length} label="Allocations open" detail="all introduced by managers" />
        <Kpi value={DEALS.filter((d) => d.score >= 70).length} label="Above the bar (70+)" tone="ok" />
        <Kpi value={fmtM(DEALS.reduce((s, d) => s + d.alloc, 0))} label="Allocation offered" />
        <Kpi value={Object.keys(dealDec).length} label="Decided this session" />
      </KpiRow>
      <Panel pad={false} title="Allocations" aside={<span className="text-[11px] text-muted-foreground">ranked by score</span>}>
        <div className="overflow-x-auto">
          <table className="tnum w-full text-[12px]">
            <thead><tr className="text-left text-[11px] text-muted-foreground">{['Company', 'Via', 'Allocation', 'Score', 'Gaps', 'By', 'Decision'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {DEALS.slice().sort((a, b) => b.score - a.score).map((d, i) => (
                <tr key={d.id} className="rise border-t align-top transition-colors hover:bg-[#F4F9F4]" style={{ animationDelay: `${i * 35}ms` }}>
                  <td className="px-3 py-2"><div className="font-medium">{d.co}</div><div className="text-[10.5px] text-muted-foreground">{d.round} · lead: {d.lead}</div></td>
                  <td className="px-3 py-2">{d.via}</td>
                  <td className="px-3 py-2">{fmtM(d.alloc)}</td>
                  <td className={cn('px-3 py-2 text-[15px] font-semibold', tone(d.score))}>{d.score}</td>
                  <td className="px-3 py-2 text-[11.5px] text-muted-foreground">{d.gaps.join('; ')}</td>
                  <td className="whitespace-nowrap px-3 py-2">{d.by}</td>
                  <td className="px-3 py-2">
                    {dealDec[d.id] ? <Tag tone="info">{LABEL[dealDec[d.id].v]}</Tag> : (
                      <div className="flex gap-1">
                        <Btn variant="primary" onClick={() => decideDeal(d.id, 'take')} data-testid={`button-take-${d.id}`}>Take</Btn>
                        <Btn onClick={() => decideDeal(d.id, 'more')} data-testid={`button-more-${d.id}`}>Ask</Btn>
                        <Btn variant="quiet-bad" onClick={() => decideDeal(d.id, 'pass')} data-testid={`button-pass-${d.id}`}>Pass</Btn>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Foot>Co-invest policy in this demo: alongside a manager we back, Series A or later, $1m to $3m, a named lead, information rights. The policy is versioned and changed only by the partners.</Foot>
    </div>
  );
}
