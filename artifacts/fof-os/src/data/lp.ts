export interface LPQuestion {
  id: string; lp: string; q: string; ans: string | null; route?: string; cites: string[]; status: 'drafted' | 'routed'; received: string;
}

export const RAISING = [
  ['Meridian Ridge Partners', 'Fund II, data room open', 'Email 2 Nov; diligence'],
  ['Harbor Peak Ventures', 'Fund III planned 2027', 'Call note 3 Oct'],
  ['Kestrel Point', 'Fund IV conversations started', 'LP day 8 Oct'],
  ['Saltmarsh Capital', 'Fund II conversations after Q1 2027', 'Call note 30 Oct, confirmed'],
];

export const LP_QUESTIONS: LPQuestion[] = [
  { id: 'q1', lp: 'LP A, pension fund', received: 'Thu 11:05', q: 'What is our look-through exposure to AI-native companies, as a share of NAV?',
    ans: 'Across the eleven managers that sent portfolio lists for Q3, 38 of 212 underlying companies are tagged AI-native by the managers themselves, 19% of look-through NAV. Three managers have not sent their lists, so the figure is a floor and is footnoted as such.',
    cites: ['Portfolio company lists, Q3, 11 managers', 'Schema: tag "AI-native", as reported by the manager', 'Documents missing: 3 lists (Operations)'], status: 'drafted' },
  { id: 'q2', lp: 'LP B, family office', received: 'Wed 14:30', q: 'Which of our managers changed their team this year, and how did we respond?',
    ans: 'Two: Saltmarsh Capital (Daniel Reyes-Kahn moves to venture partner from January; key-person clause under review by Operations) and Coral Bend Capital (new principal, Sam Idris, to confirm). Each change comes from a conversation confirmed by a member of the team.',
    cites: ['Signal capture: Saltmarsh call note, confirmed Fri 16:41', 'Monitoring: Saltmarsh key-person flag', 'Saltmarsh LPA, section 11'], status: 'drafted' },
  { id: 'q3', lp: 'LP C, endowment', received: 'Tue 10:12', q: 'DPI and TVPI by vintage, net of all costs, as of 30 September.', ans: null,
    route: "Performance figures are produced by the administrator and reconciled by the CFO; routed to the CFO with the administrator's Q3 pack as reference. The system does not recompute them.", cites: [], status: 'routed' },
  { id: 'q4', lp: 'LP A, pension fund', received: 'Mon 08:12', q: 'How many of our managers are raising a successor fund in the next twelve months?',
    ans: 'Four of our fourteen managers have started a successor fund or told us they will within twelve months: Meridian Ridge Partners (Fund II, data room open); Harbor Peak Ventures (Fund III planned 2027); Kestrel Point (Fund IV conversations started); Saltmarsh Capital (Fund II conversations after Q1 2027).',
    cites: ['Signal capture: confirmed facts, Oct and Nov 2026', 'Manager pipeline, data room status'], status: 'drafted' },
  { id: 'q5', lp: 'LP D, insurer', received: 'Mon 07:40', q: 'How is AI tooling governed inside the firm?',
    ans: "Automated tools prepare, people decide. Nothing is sent to a manager, a founder or an LP by a system; no data leaves the firm's tenant; every automated step is logged and measured weekly against the team's own decisions. The governance note describing the six rules is attached.",
    cites: ['What Scribe may do: six rules (screen 9)', 'Friday read-out, week 3'], status: 'drafted' },
];
