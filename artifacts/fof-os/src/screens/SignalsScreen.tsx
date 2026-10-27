import { Check, X } from 'lucide-react';
import { ActivityLog, Btn, Foot, Kpi, KpiRow, Panel, ScreenHead, Tag } from '@/components/kit';
import { useStore } from '@/state/store';
import { cn } from '@/lib/utils';
import { getManager } from '@/data/portfolio';
import type { Conversation } from '@/data/signals';
import { fmtM, mult } from '@/lib/format';

function highlight(c: Conversation) {
  const spans = c.facts.filter((f) => f.state !== 'rejected').map((f) => f.span).filter((s) => c.text.includes(s));
  if (!spans.length) return [c.text];
  const re = new RegExp('(' + spans.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')');
  return c.text.split(re).map((part, i) => (spans.includes(part) ? <mark key={i} className="span">{part}</mark> : part));
}

export function SignalsScreen() {
  const { convs, convSel, setUI, setFact, acceptAllHigh, acceptTask, confirmCrm, log } = useStore();
  const c = convs.find((x) => x.id === convSel) ?? convs[0];
  const m = c.org ? getManager(c.org) : null;
  const toConfirm = convs.reduce((s, x) => s + x.facts.filter((f) => f.state === 'proposed').length, 0);
  const nAcc = c.facts.filter((f) => f.state === 'accepted' || f.state === 'edited').length;
  const nProp = c.facts.filter((f) => f.state === 'proposed').length;
  const timeline = m ? [
    ...convs.filter((x) => x.org === m.id).flatMap((x) => x.facts.filter((f) => f.state !== 'rejected').map((f) => ({ when: x.when, what: `${f.f}: ${f.v}`, src: `${x.ch}, ${x.from.split(',')[0]}`, pending: f.state === 'proposed' }))),
    ...(m.rep.st === 'received' ? [{ when: `Q3, day ${m.rep.day}`, what: `NAV ${fmtM(m.nav)}, TVPI ${mult(m.tvpiRep)} net, DPI ${mult(m.dpi)}`, src: 'Quarterly report, p.4', pending: false }] : []),
    { when: 'Commitment', what: `${fmtM(m.commit)} to ${m.fund} (vintage ${m.vint}), ${Math.round(m.called * 100)}% called`, src: 'Fund ledger', pending: false },
  ].slice(0, 7) : [];

  return (
    <div>
      <ScreenHead n={1} title="Signal capture: a conversation becomes a record, once a person confirms" lead="Emails, call notes and voice memos arrive all week. Scribe extracts the people, funds and facts, highlights where each came from, and proposes the CRM update. Nothing is written until someone on the team confirms." />
      <KpiRow>
        <Kpi value={convs.length} label="Conversations this week" detail="email, call notes, voice memo" />
        <Kpi value={toConfirm} label="Facts to confirm" detail={`${convs.filter((x) => x.facts.some((f) => f.state === 'proposed')).length} conversations`} tone={toConfirm ? 'warn' : 'ok'} />
        <Kpi value="3.1 min" label="Message to record" detail="bar: 5 minutes" />
        <Kpi value="0" label="Records written by Scribe" detail="every write confirmed by a person" tone="ok" />
      </KpiRow>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <Panel title="This week" aside={<span className="text-[11px] text-muted-foreground">newest first</span>}>
          <div className="-mx-1 flex flex-col gap-1">
            {convs.map((x, i) => {
              const n = x.facts.filter((f) => f.state === 'proposed').length;
              return (
                <button key={x.id} onClick={() => setUI({ convSel: x.id })} data-testid={`row-conversation-${x.id}`} style={{ animationDelay: `${i * 35}ms` }}
                  className={cn('rise rounded-lg border px-2.5 py-2 text-left transition-colors', x.id === c.id ? 'border-[var(--ink-2)] bg-card ring-1 ring-[var(--ink-2)]' : 'border-transparent hover:border-border hover:bg-card')}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12.5px] font-medium leading-snug">{x.subj}</span>
                    {n ? <Tag tone="warn">{n} to confirm</Tag> : <Tag tone={x.status.startsWith('routed') ? 'info' : 'ok'}>{x.status.startsWith('routed') ? 'routed' : 'confirmed'}</Tag>}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{x.ch} · {x.when} · {x.from}</div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 border-t pt-2.5 text-[11px] text-muted-foreground">Hand Scribe a new email, note, photo or recording in the conversation to add one.</p>
        </Panel>

        <Panel title={c.subj} aside={<Tag>{c.ch} · {c.when}</Tag>}>
          <div className="mb-2 text-[11.5px] text-muted-foreground">From {c.from}{m && <> · attached to <b className="font-medium text-foreground">{m.name}</b></>}</div>
          <div className="rounded-lg border bg-[#FAFCFA] px-3 py-2.5 text-[12.5px] leading-[1.7]" data-testid="text-conversation-body">{highlight(c)}</div>

          <div className="mb-1 mt-4 flex items-center justify-between">
            <h4 className="text-[12.5px] font-semibold">Facts proposed <span className="font-normal text-muted-foreground">({nAcc} confirmed, {nProp} open)</span></h4>
            {nProp > 1 && <Btn onClick={() => acceptAllHigh(c.id)} data-testid="button-accept-high">Accept all at 85% or above</Btn>}
          </div>
          {c.facts.length === 0 && <p className="py-3 text-[12px] text-muted-foreground">No facts to extract: this conversation is a question and has been routed.</p>}
          <div className="divide-y">
            {c.facts.map((f) => (
              <div key={f.id} className={cn('grid grid-cols-[100px_1fr_auto] items-center gap-3 py-2 text-[12.5px] transition-opacity', f.state === 'rejected' && 'opacity-45 line-through')} data-testid={`row-fact-${f.id}`}>
                <span className="text-muted-foreground">{f.f}</span>
                <div className="min-w-0">
                  <div className="font-medium">{f.v} {f.state === 'edited' && <Tag tone="info">edited</Tag>}</div>
                  <div className="truncate text-[11px] italic text-muted-foreground">source: "{f.span}" · {Math.round(f.conf * 100)}%</div>
                </div>
                <div className="flex items-center gap-1">
                  {f.state === 'proposed' ? (
                    <>
                      <Btn variant="primary" onClick={() => setFact(c.id, f.id, 'accepted')} data-testid={`button-confirm-${f.id}`}><Check className="h-3 w-3" />Confirm</Btn>
                      <Btn variant="ghost" onClick={() => setFact(c.id, f.id, 'rejected')} aria-label="Reject" data-testid={`button-reject-${f.id}`}><X className="h-3.5 w-3.5" /></Btn>
                    </>
                  ) : f.state === 'rejected' ? <Tag>rejected</Tag> : <Tag tone="ok">confirmed</Tag>}
                </div>
              </div>
            ))}
          </div>

          {c.tasks.length > 0 && (
            <>
              <h4 className="mb-1 mt-4 text-[12.5px] font-semibold">Tasks proposed</h4>
              {c.tasks.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-1.5 text-[12.5px]">
                  <span><span className="font-medium">{t.t}</span> <span className="text-[11px] text-muted-foreground">owner: {t.owner}</span></span>
                  {t.state === 'proposed' ? <Btn onClick={() => acceptTask(c.id, i)} data-testid={`button-task-${i}`}>Create task</Btn> : <Tag tone="ok">task created</Tag>}
                </div>
              ))}
            </>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel title="After you confirm" aside={<Tag>owned by a person</Tag>}>
          {c.crm === 'na' && <p className="text-[12px] text-muted-foreground">Nothing to write: routed to the LP question desk.</p>}
          {c.crm === 'confirmed' && <div className="rounded-lg bg-[hsl(var(--ok-bg))] px-3 py-2 text-[12px] text-[hsl(var(--ok))]">CRM record updated for <b>{m?.name ?? 'the record'}</b>. Confirmed by {c.by}.</div>}
          {c.crm === 'none' && <p className="text-[12px] text-muted-foreground">Confirm at least one fact to prepare the CRM update. Scribe never writes it on its own.</p>}
          {c.crm === 'ready' && (
            <div className="space-y-2.5">
              <p className="text-[12px] text-muted-foreground">{nAcc} confirmed facts ready to write to <b className="text-foreground">{m?.name}</b>.</p>
              <Btn variant="primary" size="md" onClick={() => confirmCrm(c.id)} data-testid="button-confirm-crm">Write to the CRM record</Btn>
            </div>
          )}
        </Panel>
        <Panel title={`What we know${m ? ': ' + m.name : ''}`} aside={<Tag>one query</Tag>}>
          {!m && <p className="text-[12px] text-muted-foreground">Not attached to a fund position.</p>}
          <div className="divide-y">
            {timeline.map((k, i) => (
              <div key={i} className="grid grid-cols-[86px_1fr] gap-3 py-1.5 text-[12px]">
                <span className="text-[11px] text-muted-foreground">{k.when}</span>
                <div>{k.what} {k.pending && <Tag tone="warn">to confirm</Tag>}<div className="text-[11px] text-muted-foreground">{k.src}</div></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-3" title="Activity, tamper-evident" aside={<span className="text-[11px] text-muted-foreground">each line hashed with the previous one</span>}>
        <ActivityLog entries={log} max={9} />
      </Panel>
      <Foot>Measured in the pilot: precision and recall of extracted fields against the notes the team already writes (gold set of 100 conversations), and minutes from message to complete record.</Foot>
    </div>
  );
}
