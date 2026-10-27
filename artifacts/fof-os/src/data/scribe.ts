import type { Block, Message, Source } from '@/state/store';
import { MANAGERS, getManager, managerFlags, totals } from '@/data/portfolio';
import { PROSPECTS, scoreProspect } from '@/data/managers-pipeline';
import { DILIGENCE } from '@/data/diligence';
import { RAISING } from '@/data/lp';
import { DEALS } from '@/data/operations';
import { fmtM, mult } from '@/lib/format';
import { SAMPLE_EMAIL, SAMPLE_MEMO } from '@/data/signals';

export interface Effects {
  openScreen: (n: number) => void;
  setUI: (p: Record<string, unknown>) => void;
  addSample: (which: 'email' | 'memo') => void;
  draftLetter: () => void;
  block: (object: string, detail: string) => void;
  pause: () => void;
  log: (action: string, object: string, detail: string) => void;
}

export interface Reply {
  msg: Omit<Message, 'id' | 'role'>;
  run?: (fx: Effects) => void;
}

const S = (label: string, doc: string, loc?: string, snip?: string, extra?: Partial<Source>): Source => ({ label, doc, loc, snip, ...extra });

export const SAMPLES = [
  { key: 'email', label: 'Sample email', hint: 'Coral Bend Capital, Q3 delay and a write-off', prompt: 'Use a sample email' },
  { key: 'memo', label: 'Sample voice memo', hint: 'Partner debrief after a call with Meridian Ridge', prompt: 'Use a sample voice memo' },
  { key: 'brief', label: 'Monday brief', hint: 'Four roles, every line linked to its record', prompt: 'Give me the Monday brief' },
  { key: 'notice', label: 'Capital call notice', hint: 'Northwind Seed, call 6', prompt: 'Check the Northwind capital call notice' },
  { key: 'send', label: 'An action Scribe refuses', hint: 'Ask it to send a note externally', prompt: 'Send the note to Northwind now' },
];

export function respond(raw: string, level: number): Reply {
  const t = raw.toLowerCase();

  if (level === 0 && !/resume|what can you/.test(t)) {
    return { msg: { text: 'Scribe is paused by a partner. I keep reading and logging, but I will not draft, propose or summarise until someone resumes me on screen 9.', steps: ['Checked autonomy level: L0 Shadow (paused)'], screen: 9, screenLabel: 'What Scribe may do' }, run: (fx) => fx.openScreen(9) };
  }

  if (/send|email (them|northwind)|forward/.test(t) && !/sample/.test(t)) {
    return {
      msg: {
        refused: true,
        text: 'I cannot send that. Sending to a manager, a founder, an LP or an administrator does not exist as an action I can take (rule R-1). The note to Northwind Seed is in your drafts; you can review it and send it yourself from your mailbox.',
        steps: ['Matched request to action: message.send (external)', 'Checked rule R-1: no external send', 'Blocked and logged the attempt'],
        blocks: [{ kind: 'note', tone: 'bad', text: 'Blocked attempt recorded in the tamper-evident log. Sent by the system remains 0.' }],
        sources: [S('Rule R-1', 'What Scribe may do, screen 9', 'Six rules, R-1')],
        screen: 9, screenLabel: 'What Scribe may do',
      },
      run: (fx) => { fx.block('Northwind Seed call 6', 'request to send the note externally; refused by R-1'); fx.openScreen(9); },
    };
  }

  if (/pause/.test(t)) {
    return { msg: { text: 'Paused. From now on I only read and log. Any partner can resume me from screen 9; the pause itself is in the log.', steps: ['Kill switch requested by Partner (demo)', 'Autonomy set to L0 Shadow', 'Logged'], screen: 9, screenLabel: 'What Scribe may do' }, run: (fx) => { fx.pause(); fx.openScreen(9); } };
  }

  if (/sample email|coral bend/.test(t)) {
    return {
      msg: {
        text: `I read the email from Elena Sorescu (Coral Bend Capital) and proposed ${SAMPLE_EMAIL.facts.length} facts and ${SAMPLE_EMAIL.tasks.length} tasks. Nothing is written to the CRM until you confirm them on screen 1.`,
        steps: ['Opened the email locally', 'Matched sender to Coral Bend Capital (fund position, Fund I)', `Extracted ${SAMPLE_EMAIL.facts.length} facts with their source spans`, 'Proposed tasks; waiting for a person'],
        blocks: [{ kind: 'kv', rows: SAMPLE_EMAIL.facts.map((f) => [f.f, `${f.v} (${Math.round(f.conf * 100)}%)`] as [string, string]) }, { kind: 'note', tone: 'warn', text: 'The write-off is new information not yet in any report. It will appear in monitoring once you confirm it.' }],
        sources: SAMPLE_EMAIL.facts.map((f) => S(f.f, 'Email from Elena Sorescu, just now', 'Body', `"${f.span}"`, { conf: f.conf })),
        screen: 1, screenLabel: 'Signal capture',
      },
      run: (fx) => { fx.addSample('email'); fx.openScreen(1); },
    };
  }

  if (/voice memo|memo|debrief/.test(t)) {
    return {
      msg: {
        text: 'Transcribed your debrief and matched it to Meridian Ridge Partners. Four facts proposed; two of them update what the data room says, so diligence will show the anchor LP claim with today\u2019s memo as a second source.',
        steps: ['Transcribed 0:52 of audio in the browser', 'Matched to Meridian Ridge Partners, Fund II', `Extracted ${SAMPLE_MEMO.facts.length} facts, ${SAMPLE_MEMO.tasks.length} tasks`, 'Cross-checked against the Fund II data room'],
        blocks: [{ kind: 'kv', rows: SAMPLE_MEMO.facts.map((f) => [f.f, f.v] as [string, string]) }],
        sources: SAMPLE_MEMO.facts.map((f) => S(f.f, 'Voice memo, Partner (demo), just now', 'Transcript', `"${f.span}"`, { conf: f.conf })),
        screen: 1, screenLabel: 'Signal capture',
      },
      run: (fx) => { fx.addSample('memo'); fx.openScreen(1); },
    };
  }

  if (/monday brief|brief/.test(t)) {
    const fl = MANAGERS.filter((m) => managerFlags(m).length);
    return {
      msg: {
        text: `Good morning. Here is the week as it stands on Monday 2 November. ${fl.length} fund positions carry a flag, Meridian Ridge Fund II has 3 contradicted claims, and one capital call notice does not tie to the LPA.`,
        steps: ['Read 63 conversations, 11 Q3 reports, 8 company updates', 'Recomputed flags and vintage medians', 'Grouped by role', 'Linked every line to its record'],
        blocks: [{ kind: 'list', items: [
          `Managing partner: decide on Meridian Ridge Fund II next steps; Saltmarsh key-person change needs a view.`,
          `Investment team: 5 facts from Priya Natarajan's email waiting for confirmation; reference-call questions ready.`,
          `Portfolio and LP: Coral Bend Q3 report overdue 3 days; Harbor Peak TVPI headline ${mult(1.52)} vs components ${mult(1.44)}.`,
          `Operations: Northwind call 6 gives 7 days notice against 10 in the LPA; note drafted, held.`,
        ] }],
        sources: [S('Q3 reports', 'Manager quarterly reports, Q3 2026', '11 of 14 received'), S('Signal capture', 'Conversations, week of 26 Oct', '63 captured'), S('Northwind notice', 'Capital call notice, 29 Oct', 'p.1')],
        screen: 0, screenLabel: 'The week, by role',
      },
      run: (fx) => fx.openScreen(0),
    };
  }

  if (/what do we know|meridian/.test(t) && !/reference/.test(t)) {
    const m = getManager('m01');
    return {
      msg: {
        text: `Meridian Ridge Partners: we hold ${fmtM(m.commit)} in Fund I (vintage ${m.vint}), ${Math.round(m.called * 100)}% called, NAV ${fmtM(m.nav)}, net TVPI ${mult(m.tvpiRep)}. Fund II is in diligence; Priya Natarajan asks us for $5m and targets a first close in March 2027 (to confirm).`,
        steps: ['Searched CRM, conversations, reports and the data room', 'Merged 9 items into one timeline', 'Marked unconfirmed facts'],
        blocks: [{ kind: 'kv', rows: [['Mon 07:58', 'Email: first close March 2027, anchor $15m soft-circled (to confirm)'], ['20 Oct', 'Fund II data room opened: PPM, schedule, LPA draft, DDQ'], ['Q3 report', `NAV ${fmtM(m.nav)}, TVPI ${mult(m.tvpiRep)}, DPI ${mult(m.dpi)}`], ['Diligence', '3 claims contradicted by the data room']] }],
        sources: [S('Email, 2 Nov', 'Email from Priya Natarajan', 'Body', '"target a first close in March 2027"', { conf: 0.92 }), S('Q3 report p.4', 'Meridian Ridge Fund I, Q3 2026 report', 'Table p.4'), S('Data room', 'Fund II data room', '9 documents')],
        screen: 1, screenLabel: 'Signal capture',
      },
      run: (fx) => { fx.setUI({ convSel: 'c01' }); fx.openScreen(1); },
    };
  }

  if (/overdue/.test(t)) {
    return {
      msg: { text: 'One manager is overdue: Coral Bend Capital, 3 days past the 30-day LPA deadline for Q3. Granite Fork Ventures and Ironvale Collective are expected by 14 November (first reporting cycle). A reminder to Coral Bend is in your drafts; nothing was sent.',
        steps: ['Compared report receipt dates with LPA deadlines', 'Checked last contact per manager'],
        sources: [S('Coral Bend LPA', 'Coral Bend Capital LPA', 'Reporting, section 9.2', 'within thirty (30) days after the end of each quarter')], screen: 4, screenLabel: 'Monitor, two layers' },
      run: (fx) => { fx.setUI({ layer: 'funds', pfFilter: 'flag', pfSel: 'm03' }); fx.openScreen(4); },
    };
  }

  if (/harbor|flagged/.test(t)) {
    return {
      msg: { text: 'Harbor Peak Ventures reports a headline net TVPI of 1.52x, but the components in the same report (NAV plus distributions over paid-in) give 1.44x. Three further values were read from charts and are marked indicative until someone confirms them.',
        steps: ['Parsed Q3 report, 14 pages', 'Recomputed TVPI from components', 'Difference 0.08x above the 0.03x threshold'],
        blocks: [{ kind: 'note', tone: 'warn', text: 'Question for the IR contact drafted and held. I do not correct the manager\u2019s figure.' }],
        sources: [S('Q3 report p.4', 'Harbor Peak Ventures Q3 2026', 'Summary table p.4', 'Net TVPI 1.52x'), S('Q3 report p.11', 'Harbor Peak Ventures Q3 2026', 'Capital account p.11', 'Paid-in, NAV and distributions'), S('Chart p.6', 'Harbor Peak Ventures Q3 2026', 'Chart p.6', 'Gross IRR 18.3%', { ind: true, conf: 0.71 })],
        screen: 4, screenLabel: 'Monitor, two layers' },
      run: (fx) => { fx.setUI({ layer: 'funds', pfSel: 'm02', pfFilter: 'all' }); fx.openScreen(4); },
    };
  }

  if (/successor|raising/.test(t)) {
    return {
      msg: { text: `Four of fourteen managers are raising or will within twelve months.`, steps: ['Searched confirmed facts, Oct and Nov', 'Cross-checked manager pipeline'],
        blocks: [{ kind: 'kv', rows: RAISING.map((r) => [r[0], r[1]] as [string, string]) }],
        sources: RAISING.map((r) => S(r[0], r[2], 'Confirmed fact')), screen: 6, screenLabel: 'LP questions' },
      run: (fx) => fx.openScreen(6),
    };
  }

  if (/reference call|above the bar/.test(t)) {
    const sc = scoreProspect(PROSPECTS[0]);
    const above = PROSPECTS.filter((p) => scoreProspect(p).band === 'meet').map((p) => p.name);
    return {
      msg: { text: /above/.test(t) ? `${above.length} manager${above.length === 1 ? ' is' : 's are'} at or above the 80 bar: ${above.join(', ')}. A partner decides on screen 2.` : `Reference call for Meridian Ridge Fund II prepared. Score ${sc.total} against criteria v1.0; questions come from the open diligence claims.`,
        steps: ['Scored 6 prospects against criteria v1.0', 'Collected open claims from diligence', 'Drafted questions'],
        blocks: [{ kind: 'list', items: ['Who led each of the 14 Fund I investments, and who will lead in Fund II?', 'The DDQ lists two full-time GPs; the deck lists three. Which is right?', 'Can you share the written indication from the anchor endowment?', 'Your materials say TVPI 1.9x; we recompute 1.62x net. Can you reconcile?'] }],
        sources: [S('Criteria v1.0', 'Manager policy, week-one workshop', 'Six criteria, weights sum to 100'), S('DDQ v2 p.12', 'DDQ v2', 'p.12', 'two full-time general partners')], screen: 2, screenLabel: 'Manager pipeline' },
      run: (fx) => { fx.setUI({ pipeSel: 'p01' }); fx.openScreen(2); },
    };
  }

  if (/tvpi|contradicted|diligence/.test(t)) {
    const c = DILIGENCE.sections[1].claims[0];
    return {
      msg: { text: 'The PPM says Fund I TVPI 1.9x. Recomputed from the schedule of investments and the FY2025 audited accounts: 1.85x gross, 1.62x net. The manager\u2019s own Q3 report states 1.62x net, so the deck appears to quote a gross figure as net.',
        steps: ['Read schedule of investments (14 lines)', 'Applied fee and carry drag from audited accounts', 'Compared with PPM and Q3 report'],
        sources: [S('Schedule', 'Fund I schedule of investments', '14 lines'), S('Audited accounts', 'FY2025 audited accounts', 'Notes 4 and 7'), S('Claim', 'Fund II PPM', 'p.6', c.c)], screen: 3, screenLabel: 'Fund diligence' },
      run: (fx) => { fx.setUI({ ddFilter: 'con' }); fx.openScreen(3); },
    };
  }

  if (/paragraph|manager developments/.test(t)) {
    return {
      msg: { text: 'Drafted the manager developments paragraph and placed it in the Q3 letter, marked as Scribe\u2019s draft for your edit. Every figure in it is a chip linked to its source.',
        steps: ['Collected confirmed facts on managers', 'Drafted 4 sentences', 'Linked 4 figures to sources'], screen: 5, screenLabel: 'LP letter' },
      run: (fx) => { fx.draftLetter(); fx.openScreen(5); },
    };
  }

  if (/nav figure|nav/.test(t)) {
    return {
      msg: { text: `The NAV of fund positions, ${fmtM(totals.nav)}, is the sum of reported NAV across the 14 positions as of 30 September, as provided by the managers and reconciled by the administrator. I do not recompute marks.`,
        sources: [S('Fund ledger', 'Fund ledger and manager reports, 30 Sep 2026', 'NAV by position, 14 lines', undefined, { by: 'Operations (demo)' })], screen: 5, screenLabel: 'LP letter' },
      run: (fx) => fx.openScreen(5),
    };
  }

  if (/look-through|ai-native/.test(t)) {
    return {
      msg: { text: 'Draft answer ready: 38 of 212 underlying companies are tagged AI-native by the managers, 19% of look-through NAV, as a floor because three managers have not sent their lists. Approve it on screen 6; it goes to the IR mailbox as a draft.',
        sources: [S('Q3 lists', 'Portfolio company lists, Q3', '11 managers'), S('Missing lists', 'Documents missing', '3 managers')], screen: 6, screenLabel: 'LP questions' },
      run: (fx) => fx.openScreen(6),
    };
  }

  if (/northwind|capital call|notice/.test(t)) {
    return {
      msg: { text: 'Northwind Seed call 6 does not tie: our recompute from the LPA gives $400k for our commitment share, the notice shows $412k, and it reached us with 7 days notice against 10 in the LPA. A note to the administrator is drafted and held.',
        steps: ['Read notice, 29 Oct', 'Recomputed our share from commitment and LPA', 'Checked notice period'],
        blocks: [{ kind: 'kv', rows: [['Expected', '$400k'], ['Notice', '$412k'], ['Notice period', '7 days (LPA: 10)']] }],
        sources: [S('Notice', 'Northwind Seed capital call notice 6', 'p.1'), S('LPA', 'Northwind Seed Fund III LPA', 'Section 4.3', 'not less than ten (10) Business Days')], screen: 7, screenLabel: 'Fund operations' },
      run: (fx) => fx.openScreen(7),
    };
  }

  if (/co-invest|startup|pipeline|nimbus/.test(t)) {
    const open = DEALS.length;
    return {
      msg: { text: `${open} co-investment allocations are open, all introduced by managers. Nimbus Ledger scores 82 against the co-invest policy and has the nearest deadline (20 Nov). A partner decides.`,
        blocks: [{ kind: 'kv', rows: DEALS.slice(0, 4).map((d) => [d.co, `${d.score} \u00b7 by ${d.by}`] as [string, string]) }], screen: 8, screenLabel: 'Startup pipeline' },
      run: (fx) => fx.openScreen(8),
    };
  }

  if (/what can you|never do|rules/.test(t)) {
    return {
      msg: { text: 'I read, compute, draft, propose and ask. I never send, delete, archive, decide, sign or change a rule; those actions do not exist in my code. Six rules are checked before every action.',
        blocks: [{ kind: 'list', items: ['Read: mail, notes, reports, data rooms, ledger, CRM', 'Draft: replies, reminders, letter paragraphs, held for a person', 'Propose: CRM updates and tasks a person confirms', 'Never: send, decide, sign, change a rule'] }], screen: 9, screenLabel: 'What Scribe may do' },
      run: (fx) => fx.openScreen(9),
    };
  }

  if (/day 60|two months|roadmap/.test(t)) {
    return {
      msg: { text: 'Day 60 is the go or no-go read-out. The two months end in a number: signal capture and monitoring measured against the bar on the firm\u2019s own examples. Below the bar, the engagement stops and the firm keeps the dataset, the connectors and the report.', screen: 11, screenLabel: 'The two months' },
      run: (fx) => fx.openScreen(11),
    };
  }

  if (/resume/.test(t)) {
    return { msg: { text: 'Only a partner can resume me, from screen 9.', screen: 9, screenLabel: 'What Scribe may do' }, run: (fx) => fx.openScreen(9) };
  }

  return {
    msg: { text: 'I can answer that from the firm\u2019s records once the question maps to a screen. Try one of these: the Monday brief, what we know about a manager, overdue reports, a capital call check, or the LP letter.',
      steps: ['Searched the record', 'No confident match'] },
  };
}

export function respondToFiles(names: string[], preview?: string): Reply {
  const blocks: Block[] = [{ kind: 'note', tone: 'ok', text: 'Opened in your browser only. Nothing was uploaded, stored or sent.' }];
  if (preview) blocks.unshift({ kind: 'kv', rows: [['First lines', preview]] });
  return {
    msg: { text: `I opened ${names.length === 1 ? names[0] : names.length + ' files'} locally. In production I would extract the facts and propose them for confirmation on screen 1; in this demo, the samples show the full flow.`,
      steps: ['Read file metadata', preview ? 'Read the first lines as text' : 'Binary file: kept as an attachment', 'Waiting for a person'], blocks, screen: 1, screenLabel: 'Signal capture' },
  };
}
