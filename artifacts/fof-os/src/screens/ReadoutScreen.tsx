import { Printer } from 'lucide-react';
import { Btn, Panel, Tag } from '@/components/kit';
import { useStore } from '@/state/store';
import { READOUT_BAR, READOUT_DECISIONS, READOUT_INCIDENT, READOUT_VOLUME } from '@/data/trust';

export function ReadoutScreen() {
  const { convs, mdec, blocked, lpApproved, letterApproved } = useStore();
  const confirmed = convs.reduce((s, c) => s + c.facts.filter((f) => f.state === 'accepted' || f.state === 'edited').length, 0);
  const rejected = convs.reduce((s, c) => s + c.facts.filter((f) => f.state === 'rejected').length, 0);
  return (
    <div className="max-w-[900px]">
      <div className="rise mb-5 flex items-end justify-between gap-4 border-b-2 border-[var(--ink)] pb-3">
        <div>
          <div className="eyebrow mb-1.5">Screen 10 · prepared for the partners · synthetic example</div>
          <h1 className="text-[24px] font-semibold tracking-[-0.03em]">Friday read-out, pilot week 3</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">Signal capture and monitoring foundation</p>
        </div>
        <Btn onClick={() => window.print()} data-testid="button-print"><Printer className="h-3.5 w-3.5" />Print or save as PDF</Btn>
      </div>
      <div className="grid gap-3 2xl:grid-cols-2">
        <Panel title="Against the bar">
          <table className="tnum w-full text-[12px]">
            <thead><tr className="text-left text-[11px] text-muted-foreground"><th className="py-1 font-medium">Metric</th><th className="text-right font-medium">Bar</th><th className="text-right font-medium">This week</th><th className="pl-3 font-medium">Status</th></tr></thead>
            <tbody>{READOUT_BAR.map((r) => <tr key={r[0]} className="border-t"><td className="py-1.5 pr-2">{r[0]}</td><td className="text-right text-muted-foreground">{r[1]}</td><td className="text-right font-semibold">{r[2]}</td><td className="pl-3">{r[3] === 'met' ? <Tag tone="ok">met</Tag> : <Tag tone="warn">watch</Tag>}</td></tr>)}</tbody>
          </table>
        </Panel>
        <Panel title="Volume">
          <table className="tnum w-full text-[12px]"><tbody>
            {READOUT_VOLUME.map(([k, v]) => <tr key={k} className="border-t first:border-0"><td className="py-1.5 pr-2 text-muted-foreground">{k}</td><td className="text-right font-semibold">{v}</td></tr>)}
            <tr className="border-t"><td className="py-1.5 text-muted-foreground">Blocked attempts (red-team tests and this session)</td><td className="text-right font-semibold">{blocked}</td></tr>
          </tbody></table>
        </Panel>
        <Panel title="Incidents"><p className="text-[12.5px] leading-relaxed">{READOUT_INCIDENT}</p></Panel>
        <Panel title="Decisions needed from the partners">
          <ol className="list-decimal space-y-1.5 pl-4 text-[12.5px] leading-relaxed">{READOUT_DECISIONS.map((d) => <li key={d}>{d}</li>)}</ol>
        </Panel>
      </div>
      <Panel className="mt-3" title="This demo session" aside={<Tag tone="info">live from your clicks</Tag>}>
        <div className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-5">
          {[['Facts confirmed', confirmed], ['Facts rejected', rejected], ['Manager decisions', Object.keys(mdec).length], ['LP answers approved', Object.keys(lpApproved).length], ['Letter approved', letterApproved ? 'Yes' : 'No']].map(([k, v]) => (
            <div key={k as string}><div className="tnum text-[20px] font-semibold tracking-[-0.03em]">{v}</div><div className="text-muted-foreground">{k}</div></div>
          ))}
        </div>
      </Panel>
      <p className="mt-6 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">All figures on this page are synthetic and illustrative; in the pilot they are computed from the firm's own data and delivered every Friday. Below the bar on day 30, the engagement stops and the firm keeps the dataset, the connectors and the report.</p>
    </div>
  );
}
