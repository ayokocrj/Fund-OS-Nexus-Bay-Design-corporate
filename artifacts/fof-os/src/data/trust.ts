export const LEVELS = [
  { n: 'Shadow', d: 'Reads and logs; proposes nothing. Used for the first weeks and whenever a partner pauses it.' },
  { n: 'On request', d: 'Answers when asked, with sources.' },
  { n: 'Proactive', d: 'Puts queues, flags, briefs and drafts in front of the right person without being asked.' },
  { n: 'Prepared actions', d: 'Prepares CRM updates and reminder drafts for one-click confirmation. Still never sends.' },
];

export const RULES: [string, string][] = [
  ['R-1', 'Nothing is sent by Scribe to a manager, a founder, an LP or an administrator; every message is a draft in a person\u2019s mailbox.'],
  ['R-2', 'No record is written to the CRM, no document filed, no fact stored without a person confirming it.'],
  ['R-3', 'No commitment, pass or archive is decided by Scribe; "Decided" has no machine transition.'],
  ['R-4', 'No figure without a source: every number shown carries its document, page or timestamp, and who confirmed it.'],
  ['R-5', 'No data leaves the firm\u2019s tenant; model providers receive the text needed for one task, never the database or the data room.'],
  ['R-6', 'No change of criteria, thresholds or autonomy level without a signed change request; any partner can pause Scribe at once.'],
];

export const PERMISSIONS: [string, string, string][] = [
  ['Read', 'Emails, call notes, recordings with consent, reports, data rooms, the ledger, the CRM', 'Always'],
  ['Compute', 'Scores, recomputed multiples, flags, medians, reconciliations', 'Always'],
  ['Draft', 'Replies, reminders, letter paragraphs, questions, briefs', 'Level 2 and above, held for a person'],
  ['Propose', 'CRM updates, tasks, document requests, into a queue a person confirms', 'Level 3, one-click confirmation'],
  ['Ask', 'A question back to the person when a source is missing or two facts contradict', 'Always'],
  ['Send, delete, archive, decide, sign, change a rule', 'Does not exist as an action; adding it fails the build', 'Never'],
];

export const EVALS: [string, string, string, string][] = [
  ['Signal capture: fields extracted vs the team\u2019s own notes', '100 past conversations', 'precision 85%, recall 80%', '91% / 86%'],
  ['Signal capture: "what do we know about X" with correct sources', '20 questions', '100%', '19 / 20'],
  ['Monitoring: values parsed from reports without correction', '50 past quarterly reports', '90%', '94%'],
  ['Monitoring: discrepancies a manual review had missed', 'same 50', 'report', '3'],
  ['Second pass: planted errors caught before display', '50 planted outputs', 'set in week one', '48 / 50'],
  ['Documents with hidden instructions, executed', '30 planted documents', '0', '0'],
];

export const WHERE_IT_RUNS: [string, string][] = [
  ['Where', 'The firm\u2019s cloud tenant, its CRM, its mailbox and drive, through their connectors'],
  ['Who owns the keys', 'The firm; model accounts and API keys created in its name on day one'],
  ['What providers see', 'The text needed for one task; never the database, never the data room'],
  ['Who can switch it off', 'Any partner, one button, on this screen'],
  ['Exit', 'Code, data, logs and runbooks are already the firm\u2019s; handover checklist signed per workflow'],
];

export const BUILD_OR_BUY: [string, string, string][] = [
  ['CRM and relationships', 'The CRM already in place', 'Capture from conversations into it'],
  ['Fund administration and NAV', 'The administrator', 'Reconciliation against the ledger and LPA'],
  ['Data room and documents', 'The existing drive', 'Claims index with sources'],
  ['Monitoring schema across two layers', 'Nothing fits both layers', 'Built, owned by the firm'],
  ['Rules, log and measurement', 'Not sold as a product', 'Built, owned by the firm'],
];

export const READOUT_BAR: [string, string, string, 'met' | 'watch'][] = [
  ['Fields extracted, precision (vs the team\u2019s notes)', '85%', '91%', 'met'],
  ['Fields extracted, recall', '80%', '86%', 'met'],
  ['Minutes from message to complete record', '5', '3.1', 'met'],
  ['"What do we know about X", answered with correct sources', '20 / 20', '19 / 20', 'watch'],
  ['Report values parsed without correction', '90%', '94%', 'met'],
  ['Sent by the system', '0', '0', 'met'],
  ['Silent failures', '0', '0', 'met'],
  ['Read-out delivered', 'Fri', 'Fri 11:00', 'met'],
];

export const READOUT_VOLUME: [string, string][] = [
  ['Conversations captured', '63'],
  ['Facts proposed / confirmed without edit / edited / rejected', '214 / 171 / 31 / 12'],
  ['Quarterly reports parsed; discrepancies found', '9 / 2'],
  ['Disagreements reviewed with a partner', '6 (4 field definitions, 2 judgement)'],
  ['Baseline, measured week 1 on 10 real conversations', '12 min per conversation'],
  ['Hours returned this week (63 \u00d7 8.9 min)', '9.3 h'],
];

export const READOUT_DECISIONS = [
  'The one retrieval miss: "fund size" answered from the deck instead of the LPA. Define the field once and sign it.',
  'Promote monitoring from Shadow to On request: two read-outs at bar on the 50 past reports; change request CR-002 drafted.',
  'Start the monitoring schema on the 14 Q3 reports in week 5, or wait for the day 30 read-out.',
];

export const READOUT_INCIDENT =
  'Wednesday 09:12: mailbox token expired. Retry failed twice; fallback to manual intake notified to the associate at 09:14; token renewed; backlog of 4 conversations cleared by 10:05. No data lost, nothing sent, logged as INC-003.';

export interface Phase { n: string; a: number; b: number; tone: string; label: string; exit: string }
export const PHASES: Phase[] = [
  { n: 'Scoping and schema', a: 1, b: 2, tone: 'var(--sage)', label: '2 weeks', exit: 'Criteria workshop done; 100 conversations and 14 reports exported as the gold set; access granted; definition of done signed' },
  { n: 'Signal capture, shadow mode', a: 3, b: 6, tone: 'var(--ink-2)', label: '4 weeks', exit: 'Precision and recall at bar on the gold set; "what do we know" answered with sources; L1 then L2' },
  { n: 'Monitoring foundation and read-out', a: 7, b: 8, tone: 'var(--ink)', label: '2 weeks', exit: 'Day 60 read-out: the two months end in a number; go or no-go on the next step' },
  { n: 'Monitoring, two layers, production', a: 9, b: 12, tone: '#4F7556', label: '4 weeks', exit: 'Reports parsed at bar; flags the day a report lands' },
  { n: 'LP letter and question desk', a: 13, b: 16, tone: '#4F7556', label: '4 weeks', exit: 'First letter drafted from the table within 3 working days of quarter end' },
  { n: 'Fund diligence assist', a: 17, b: 22, tone: '#8FB394', label: '6 weeks', exit: 'Claims checked and multiples recomputed on two past data rooms; sections accepted at bar' },
  { n: 'Operations: notices, documents, KYC, calendar', a: 23, b: 26, tone: '#8FB394', label: '4 weeks', exit: 'Standard request answered under one hour; discrepancies caught before funding' },
  { n: 'Startup pipeline (last, not the focus)', a: 27, b: 30, tone: '#A9C2AC', label: '4 weeks', exit: 'Co-invest scoring at bar on past decisions' },
  { n: 'Friday read-out and reviews', a: 3, b: 30, tone: '#CBD8CD', label: 'every Friday', exit: 'Delivered every Friday; gold set extended monthly; criteria reviewed quarterly' },
];
export const GATES: [number, string][] = [[2, 'DoD signed'], [6, 'Capture at bar'], [8, 'Day 60: go / no-go'], [16, 'First letter'], [22, 'Memo bar'], [26, 'Ops bar']];

export const CADENCE: [string, string][] = [
  ['Kickoff', '30 minutes: acceptance criteria, access, risks'],
  ['Every Friday', 'Six-minute video and one page: delivered, blocked, decisions needed, metrics against the bar'],
  ['Every two weeks', '20-minute check-in near a milestone'],
  ['Before each workflow goes live', 'The firm\u2019s own test week on real cases'],
  ['Monthly', 'Gold set extended with the month\u2019s confirmations; drift reported'],
  ['Quarterly', 'Criteria and thresholds reviewed with the partners; changes by signed request only'],
];

export const HANDOVER = [
  'Test and production copies, separate credentials, all in the firm\u2019s name',
  'Configuration and secrets inventory (names, owners, rotation)',
  'Runbook: restart, pause, roll back, rotate a key',
  'Gold set and evaluation scripts, re-runnable by the firm',
  'Log export and retention policy agreed with compliance',
  'A named owner inside the firm, trained on a real week',
];

export const COVERAGE: [string, string, string, string, string][] = [
  ['Signal capture', 'Everyone who takes calls or reads mail', 'Conversation to CRM record, fund memory, CRM hygiene', 'Notes already written by the team', 'Weeks 3 to 6'],
  ['Manager pipeline', 'Partners, investment team', 'Criteria scoring, gaps, reference-call questions', 'Past commit and pass decisions', 'Weeks 3 to 6'],
  ['Fund diligence', 'Investment team', 'Data room claims, track record recomputed, LPA terms against policy', 'Past data rooms and decisions', 'After the two months'],
  ['Monitoring, two layers', 'Portfolio and LP team', 'Report parsing, schema, flags, cohorts', 'Past quarterly reports and updates', 'Weeks 5 to 8'],
  ['LP reporting', 'Partners, IR', 'Letter from the table, LP question desk', 'Past letters and questions', 'After'],
  ['Operations', 'Operations, administrator', 'Capital call and distribution checks, documents, KYC, calendar', 'Notices, LPA, policies', 'After'],
  ['Startup pipeline', 'Partners', 'Co-invest scoring with the same engine', 'Past decisions', 'Last'],
];
