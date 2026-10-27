export type FactState = 'proposed' | 'accepted' | 'edited' | 'rejected';
export interface Fact { id: string; f: string; v: string; conf: number; span: string; state: FactState }
export interface Task { t: string; owner: string; state: 'proposed' | 'accepted' }
export interface Conversation {
  id: string; when: string; ch: string; from: string; subj: string; org: string | null; status: string; text: string;
  facts: Fact[]; tasks: Task[]; crm: 'none' | 'ready' | 'confirmed' | 'na'; by?: string;
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c01', when: 'Mon 07:58', ch: 'Email', from: 'Priya Natarajan, Meridian Ridge Partners', subj: 'Fund II: updated timeline and DDQ v2', org: 'm01', status: 'to confirm',
    text: 'Hi team, a quick update on Fund II. We now target a first close in March 2027 rather than the quarter as a whole. The anchor is a university endowment with $15m soft-circled. Attached is DDQ v2. Terms unchanged: 2% management fee, 20% carry, GP commitment 2%. Would Nexus Bay consider a $5m commitment? Happy to set up reference calls with two Fund I LPs. Best, Priya',
    facts: [
      { id: 'f1', f: 'First close target', v: 'March 2027', conf: 0.92, span: 'target a first close in March 2027', state: 'proposed' },
      { id: 'f2', f: 'Anchor LP', v: 'University endowment, $15m soft-circled', conf: 0.85, span: 'university endowment with $15m soft-circled', state: 'proposed' },
      { id: 'f3', f: 'Document received', v: 'DDQ v2 (attached, filed to the data room)', conf: 0.97, span: 'Attached is DDQ v2', state: 'proposed' },
      { id: 'f4', f: 'Terms', v: '2% fee, 20% carry, GP commitment 2%', conf: 0.88, span: '2% management fee, 20% carry, GP commitment 2%', state: 'proposed' },
      { id: 'f5', f: 'Commitment asked', v: '$5m', conf: 0.9, span: '$5m commitment', state: 'proposed' },
    ],
    tasks: [
      { t: 'Review DDQ v2 before the reference calls', owner: 'Investment team', state: 'proposed' },
      { t: 'Schedule reference calls with two Fund I LPs', owner: 'Partner', state: 'proposed' },
    ],
    crm: 'none',
  },
  {
    id: 'c02', when: 'Fri 16:20', ch: 'Call note', from: 'Associate, call with Daniel Reyes-Kahn (Saltmarsh Capital)', subj: 'Quarterly catch-up', org: 'm07', status: 'confirmed',
    text: 'Catch-up with Daniel. Fund I: three new investments this quarter, reserves at 40%. Daniel: from January I move to a venture partner role; Ana becomes the sole full-time GP. No change to the key-person clause has been proposed. They plan Fund II conversations after Q1 2027.',
    facts: [
      { id: 'f1', f: 'Key person', v: 'Daniel Reyes-Kahn to venture partner from January; Ana Ferreira sole full-time GP', conf: 0.9, span: 'from January I move to a venture partner role; Ana becomes the sole full-time GP', state: 'accepted' },
      { id: 'f2', f: 'Reserves', v: '40% of Fund I', conf: 0.8, span: 'reserves at 40%', state: 'accepted' },
      { id: 'f3', f: 'Successor fund', v: 'Fund II conversations after Q1 2027', conf: 0.75, span: 'Fund II conversations after Q1 2027', state: 'edited' },
    ],
    tasks: [{ t: 'Re-read the key-person clause of the Saltmarsh LPA', owner: 'Operations', state: 'accepted' }],
    crm: 'confirmed', by: 'Associate (demo), Fri 16:41',
  },
  {
    id: 'c03', when: 'Thu 11:05', ch: 'Email', from: 'LP A, pension fund, investment office', subj: 'Look-through exposure to AI-native companies', org: null, status: 'routed to LP questions',
    text: 'Could you share our look-through exposure to AI-native companies across the fund positions, as a share of NAV, as of the last quarter?',
    facts: [], tasks: [], crm: 'na',
  },
  {
    id: 'c04', when: 'Wed 09:40', ch: 'Email with PDF', from: 'Harbor Peak Ventures, investor relations', subj: 'Q3 2026 quarterly report', org: 'm02', status: 'parsed, 3 values to confirm',
    text: 'Please find attached our Q3 2026 quarterly report (14 pages). Net TVPI 1.52x. Capital call 9 expected in December.',
    facts: [{ id: 'f1', f: 'Capital call', v: 'Call 9 expected in December', conf: 0.8, span: 'Capital call 9 expected in December', state: 'accepted' }],
    tasks: [], crm: 'confirmed', by: 'Associate (demo), Wed 10:02',
  },
  {
    id: 'c05', when: 'Tue 15:12', ch: 'Email', from: 'Grace Whitfield, Bluefern Ventures', subj: 'Co-invest: Nimbus Ledger Series B', org: 'm08', status: 'routed to pipeline',
    text: 'Nimbus Ledger is raising a $40m Series B led by a growth fund. We have a $1.5m allocation for LPs who want it; decision by 20 November. Data room link below.',
    facts: [
      { id: 'f1', f: 'Co-invest allocation', v: '$1.5m in Nimbus Ledger Series B ($40m round)', conf: 0.9, span: '$1.5m allocation', state: 'proposed' },
      { id: 'f2', f: 'Deadline', v: '20 November', conf: 0.95, span: 'decision by 20 November', state: 'proposed' },
    ],
    tasks: [{ t: 'Decide on the Nimbus Ledger allocation by 20 November', owner: 'Partner', state: 'proposed' }],
    crm: 'none',
  },
];

export const SAMPLE_EMAIL: Conversation = {
  id: 'c06', when: 'just now', ch: 'Email', from: 'Elena Sorescu, Coral Bend Capital', subj: 'Q3 report and portfolio news', org: 'm03', status: 'to confirm',
  text: 'Apologies for the delay on the Q3 report; it goes out Friday 6 November after our auditor sign-off. One note ahead of it: we wrote off Tidepool Logistics in full ($0.6m cost). We hired a principal, Sam Idris, ex-operator. We now plan the first close of Fund II in the second half of 2027. Happy to jump on a call next week.',
  facts: [
    { id: 'f1', f: 'Q3 report', v: 'Expected Friday 6 November', conf: 0.93, span: 'goes out Friday 6 November', state: 'proposed' },
    { id: 'f2', f: 'Write-off', v: 'Tidepool Logistics, full write-off, $0.6m cost', conf: 0.88, span: 'wrote off Tidepool Logistics in full ($0.6m cost)', state: 'proposed' },
    { id: 'f3', f: 'Team', v: 'New principal: Sam Idris', conf: 0.86, span: 'hired a principal, Sam Idris', state: 'proposed' },
    { id: 'f4', f: 'Successor fund', v: 'Fund II first close planned H2 2027', conf: 0.82, span: 'first close of Fund II in the second half of 2027', state: 'proposed' },
  ],
  tasks: [
    { t: 'Hold the overdue reminder until Friday 6 November', owner: 'Portfolio and LP', state: 'proposed' },
    { t: 'Book a call with Elena next week', owner: 'Partner', state: 'proposed' },
  ],
  crm: 'none',
};

export const SAMPLE_MEMO: Conversation = {
  id: 'c07', when: 'just now', ch: 'Voice memo', from: 'Partner (demo), after a call with Priya Natarajan (Meridian Ridge)', subj: 'Call debrief, Fund II', org: 'm01', status: 'to confirm',
  text: 'Just got off the call with Priya. First close is now firmly March 2027. The anchor endowment moved from soft-circled to a signed indication at fifteen million. They will send the updated track record schedule by Friday. Their third name, Omar, is confirmed as venture partner only, not a GP. She asked again whether we would take five million; I said we would answer after the two LP reference calls.',
  facts: [
    { id: 'f1', f: 'First close target', v: 'March 2027 (confirmed)', conf: 0.94, span: 'First close is now firmly March 2027', state: 'proposed' },
    { id: 'f2', f: 'Anchor LP', v: 'Endowment, signed indication, $15m', conf: 0.87, span: 'signed indication at fifteen million', state: 'proposed' },
    { id: 'f3', f: 'Team', v: 'Omar: venture partner, not a GP', conf: 0.83, span: 'Omar, is confirmed as venture partner only, not a GP', state: 'proposed' },
    { id: 'f4', f: 'Our position', v: 'Answer on $5m after two LP reference calls', conf: 0.9, span: 'we would answer after the two LP reference calls', state: 'proposed' },
  ],
  tasks: [
    { t: 'Expect the updated track record schedule by Friday', owner: 'Investment team', state: 'proposed' },
    { t: 'Two LP reference calls before answering on $5m', owner: 'Partner', state: 'proposed' },
  ],
  crm: 'none',
};
