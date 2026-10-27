import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { djb2 } from '@/lib/format';
import { CONVERSATIONS, type Conversation, type FactState } from '@/data/signals';
import { RECENT_SEED } from '@/data/screens';

export interface Source { label: string; doc: string; loc?: string; snip?: string; conf?: number; ind?: boolean; by?: string }
export type Block =
  | { kind: 'list'; items: string[] }
  | { kind: 'kv'; rows: [string, string][] }
  | { kind: 'note'; tone: 'ok' | 'warn' | 'bad'; text: string };
export interface Attachment { name: string; size: number; type: string; url?: string; preview?: string }
export interface Message {
  id: string; role: 'user' | 'scribe'; text: string; steps?: string[]; blocks?: Block[]; sources?: Source[];
  screen?: number; screenLabel?: string; attachments?: Attachment[]; streaming?: boolean; refused?: boolean;
}
export interface Thread { id: string; title: string; when: string; msgs: Message[] }
export interface LogEntry { ts: string; actor: string; action: string; object: string; detail: string; h: string; kind: 'system' | 'partner' | 'blocked' }
export type Decision = { v: string; by: string };

interface UIState {
  pfSel: string; coSel: string; layer: 'funds' | 'companies'; pfFilter: 'all' | 'flag';
  convSel: string; pipeSel: string; ddFilter: 'all' | 'ver' | 'unv' | 'con'; logFilter: 'all' | 'system' | 'partner' | 'blocked';
}

interface Store extends UIState {
  level: number; pausedBy: string | null; blocked: number; log: LogEntry[];
  convs: Conversation[]; mdec: Record<string, Decision>; dealDec: Record<string, Decision>;
  letterUnv: Record<'a' | 'b' | 'c', boolean>; letterAgent: boolean; letterApproved: boolean;
  lpApproved: Record<string, boolean>; chartOk: Record<string, boolean>; heldDrafts: Record<string, boolean>;
  threads: Thread[]; activeThread: string; voice: boolean; source: Source | null;
  setUI: (p: Partial<UIState>) => void;
  setLevel: (n: number) => void; pause: () => void; resume: () => void;
  logEvent: (actor: string, action: string, object: string, detail: string, kind?: LogEntry['kind']) => void;
  block: (object: string, detail: string) => void;
  setFact: (convId: string, factId: string, state: FactState) => void;
  acceptAllHigh: (convId: string) => void;
  acceptTask: (convId: string, i: number) => void;
  confirmCrm: (convId: string) => void;
  addConversation: (c: Conversation) => void;
  decideManager: (id: string, v: string) => void; undoManager: (id: string) => void;
  decideDeal: (id: string, v: string) => void;
  resolveLetter: (k: 'a' | 'b' | 'c') => void; setLetterAgent: (v: boolean) => void; approveLetter: () => void;
  approveLp: (id: string) => void; confirmChart: (k: string) => void; holdDraft: (k: string) => void;
  newThread: () => void; selectThread: (id: string) => void;
  pushMessage: (m: Message) => void; patchMessage: (id: string, p: Partial<Message>) => void;
  setVoice: (v: boolean) => void; openSource: (s: Source | null) => void;
  openScreen: (n: number) => void; closeScreens: () => void;
}

const Ctx = createContext<Store | null>(null);

let clock = 7 * 3600 + 58 * 60 + 4;
function nextTs(first: boolean) {
  if (!first) clock += 3 + Math.floor(Math.random() * 9);
  const h = Math.floor(clock / 3600), m = Math.floor((clock % 3600) / 60), s = clock % 60;
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
}
function makeEntry(prev: string, first: boolean, actor: string, action: string, object: string, detail: string, kind: LogEntry['kind']): LogEntry {
  return { ts: nextTs(first), actor, action, object, detail, h: djb2(prev + actor + action + object + detail), kind };
}
function seedLog(): LogEntry[] {
  const seed: [string, string, string, string, LogEntry['kind']][] = [
    ['Scribe', 'report.parsed', 'Harbor Peak Q3', '14 pages, 3 tables, 1 chart; 11 values mapped; 3 chart-read values marked indicative', 'system'],
    ['Scribe', 'flag.raised', 'Harbor Peak Ventures', 'TVPI headline 1.52x vs components 1.44x; question drafted, held', 'system'],
    ['Scribe', 'signal.extracted', 'Saltmarsh call note', '3 facts, 1 task; confidence 0.75 to 0.90', 'system'],
    ['Associate', 'facts.confirmed', 'Saltmarsh call note', '3 facts confirmed (1 edited)', 'partner'],
    ['Associate', 'crm.update.confirmed', 'Saltmarsh Capital', 'key person, reserves, successor fund written to the CRM record', 'partner'],
    ['Scribe', 'flag.raised', 'Saltmarsh Capital', 'key person change from confirmed call note; not yet in the report', 'system'],
    ['Scribe', 'signal.extracted', 'Meridian Ridge email', '5 facts, 2 tasks proposed; awaiting confirmation', 'system'],
    ['Scribe', 'notice.checked', 'Northwind Seed call 6', '7 days notice vs 10; $412k vs $400k expected; note drafted, held', 'system'],
    ['Scribe', 'reminder.drafted', 'Coral Bend Capital', 'Q3 report overdue 3 days; reminder held in drafts', 'system'],
    ['Scribe', 'brief.prepared', 'Monday brief', '4 roles, 19 lines, every line linked to its record', 'system'],
  ];
  const out: LogEntry[] = [];
  let prev = '00000000';
  seed.forEach((s, i) => { const e = makeEntry(prev, i === 0, ...s); prev = e.h; out.push(e); });
  return out;
}

const welcomeThread = (): Thread => ({ id: 't-' + Date.now(), title: 'New conversation', when: 'Now', msgs: [] });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const [ui, setUi] = useState<UIState>({ pfSel: 'm02', coSel: 'co4', layer: 'funds', pfFilter: 'all', convSel: 'c01', pipeSel: 'p01', ddFilter: 'all', logFilter: 'all' });
  const [level, setLevelState] = useState(3);
  const [pausedBy, setPausedBy] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(0);
  const [log, setLog] = useState<LogEntry[]>(seedLog);
  const [convs, setConvs] = useState<Conversation[]>(() => CONVERSATIONS.map((c) => ({ ...c, facts: c.facts.map((f) => ({ ...f })), tasks: c.tasks.map((t) => ({ ...t })) })));
  const [mdec, setMdec] = useState<Record<string, Decision>>({});
  const [dealDec, setDealDec] = useState<Record<string, Decision>>({});
  const [letterUnv, setLetterUnv] = useState({ a: true, b: true, c: true });
  const [letterAgent, setLetterAgentS] = useState(false);
  const [letterApproved, setLetterApproved] = useState(false);
  const [lpApproved, setLpApproved] = useState<Record<string, boolean>>({});
  const [chartOk, setChartOk] = useState<Record<string, boolean>>({});
  const [heldDrafts, setHeld] = useState<Record<string, boolean>>({});
  const initial = useMemo(welcomeThread, []);
  const [threads, setThreads] = useState<Thread[]>(() => [initial, ...RECENT_SEED.map((r) => ({ ...r, msgs: [] }))]);
  const [activeThread, setActive] = useState(initial.id);
  const [voice, setVoice] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const activeRef = useRef(activeThread);
  activeRef.current = activeThread;

  const logEvent = useCallback((actor: string, action: string, object: string, detail: string, kind?: LogEntry['kind']) => {
    setLog((L) => [...L, makeEntry(L.length ? L[L.length - 1].h : '00000000', false, actor, action, object, detail, kind ?? (actor === 'Scribe' ? 'system' : 'partner'))]);
  }, []);

  const store: Store = {
    ...ui, level, pausedBy, blocked, log, convs, mdec, dealDec, letterUnv, letterAgent, letterApproved, lpApproved, chartOk, heldDrafts,
    threads, activeThread, voice, source,
    setUI: (p) => setUi((s) => ({ ...s, ...p })),
    setLevel: (n) => {
      setLevelState(n);
      if (n > 0) setPausedBy(null);
      logEvent('Partner', 'autonomy.changed', 'Scribe', `Level set to L${n}` + (n > level ? ' (signed change request CR-004)' : ''));
    },
    pause: () => { setLevelState(0); setPausedBy('Partner (demo)'); logEvent('Partner', 'scribe.paused', 'Scribe', 'Kill switch: all drafting and proposing stopped; reading and logging continue'); },
    resume: () => { setLevelState(3); setPausedBy(null); logEvent('Partner', 'scribe.resumed', 'Scribe', 'Resumed at L3 Prepared actions'); },
    logEvent,
    block: (object, detail) => { setBlocked((b) => b + 1); logEvent('Scribe', 'action.blocked', object, detail, 'blocked'); },
    setFact: (cid, fid, st) => {
      setConvs((cs) => cs.map((c) => c.id !== cid ? c : { ...c, facts: c.facts.map((f) => (f.id === fid ? { ...f, state: st } : f)), crm: c.crm === 'none' && st !== 'rejected' ? 'ready' : c.crm }));
      const c = convs.find((x) => x.id === cid); const f = c?.facts.find((x) => x.id === fid);
      if (c && f) logEvent('Partner', st === 'rejected' ? 'fact.rejected' : 'fact.confirmed', c.subj, `${f.f}: ${f.v}`);
    },
    acceptAllHigh: (cid) => {
      const c = convs.find((x) => x.id === cid); if (!c) return;
      const n = c.facts.filter((f) => f.state === 'proposed' && f.conf >= 0.85).length;
      setConvs((cs) => cs.map((x) => x.id !== cid ? x : { ...x, crm: x.crm === 'none' ? 'ready' : x.crm, facts: x.facts.map((f) => (f.state === 'proposed' && f.conf >= 0.85 ? { ...f, state: 'accepted' } : f)) }));
      logEvent('Partner', 'facts.confirmed', c.subj, `${n} facts at 85% or above confirmed in one action`);
    },
    acceptTask: (cid, i) => {
      setConvs((cs) => cs.map((x) => x.id !== cid ? x : { ...x, tasks: x.tasks.map((t, j) => (j === i ? { ...t, state: 'accepted' } : t)) }));
      const t = convs.find((x) => x.id === cid)?.tasks[i];
      if (t) logEvent('Partner', 'task.created', t.owner, t.t);
    },
    confirmCrm: (cid) => {
      setConvs((cs) => cs.map((x) => (x.id !== cid ? x : { ...x, crm: 'confirmed', by: 'Partner (demo), just now', status: 'confirmed' })));
      const c = convs.find((x) => x.id === cid);
      if (c) logEvent('Partner', 'crm.update.confirmed', c.from.split(',')[0], `${c.facts.filter((f) => f.state === 'accepted' || f.state === 'edited').length} confirmed facts written to the CRM record`);
    },
    addConversation: (c) => {
      setConvs((cs) => (cs.some((x) => x.id === c.id) ? cs : [{ ...c, facts: c.facts.map((f) => ({ ...f })), tasks: c.tasks.map((t) => ({ ...t })) }, ...cs]));
      setUi((s) => ({ ...s, convSel: c.id }));
      logEvent('Scribe', 'signal.extracted', c.subj, `${c.facts.length} facts, ${c.tasks.length} tasks proposed; awaiting confirmation`);
    },
    decideManager: (id, v) => { setMdec((d) => ({ ...d, [id]: { v, by: 'Partner (demo), just now' } })); logEvent('Partner', 'manager.decided', id, v); },
    undoManager: (id) => { setMdec((d) => { const n = { ...d }; delete n[id]; return n; }); logEvent('Partner', 'manager.decision.reopened', id, 'decision withdrawn'); },
    decideDeal: (id, v) => { setDealDec((d) => ({ ...d, [id]: { v, by: 'Partner (demo)' } })); logEvent('Partner', 'coinvest.decided', id, v); },
    resolveLetter: (k) => { setLetterUnv((u) => ({ ...u, [k]: false })); logEvent('Partner', 'letter.figure.resolved', 'Q3 letter', `figure ${k.toUpperCase()} resolved with a source`); },
    setLetterAgent: (v) => { setLetterAgentS(v); if (v) logEvent('Scribe', 'letter.paragraph.drafted', 'Q3 letter', 'manager developments paragraph, 4 sourced figures, held for edit'); },
    approveLetter: () => { setLetterApproved(true); logEvent('Partner', 'letter.approved', 'Q3 letter', 'approved for partner review; not sent'); },
    approveLp: (id) => { setLpApproved((a) => ({ ...a, [id]: true })); logEvent('Partner', 'lp.answer.approved', id, 'answer approved; placed in the IR mailbox as a draft'); },
    confirmChart: (k) => { setChartOk((c) => ({ ...c, [k]: true })); logEvent('Partner', 'value.confirmed', 'Harbor Peak Q3', `chart-read value ${k.toUpperCase()} confirmed against the PDF`); },
    holdDraft: (k) => { setHeld((h) => ({ ...h, [k]: true })); logEvent('Partner', 'draft.reviewed', k, 'draft reviewed and placed in your mailbox; not sent'); },
    newThread: () => { const t = welcomeThread(); setThreads((T) => [t, ...T]); setActive(t.id); },
    selectThread: (id) => setActive(id),
    pushMessage: (m) => setThreads((T) => T.map((t) => (t.id !== activeRef.current ? t : { ...t, title: t.msgs.length === 0 && m.role === 'user' ? m.text.slice(0, 42) || 'Shared files' : t.title, msgs: [...t.msgs, m] }))),
    patchMessage: (id, p) => setThreads((T) => T.map((t) => ({ ...t, msgs: t.msgs.map((m) => (m.id === id ? { ...m, ...p } : m)) }))),
    setVoice,
    openSource: setSource,
    openScreen: (n) => navigate(`/screens/${n}`),
    closeScreens: () => navigate('/'),
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}
