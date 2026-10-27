export interface ScreenDef { id: number; key: string; title: string; short: string; group: 'Overview' | 'Signals and managers' | 'Portfolio and LPs' | 'Trust' }

export const SCREENS: ScreenDef[] = [
  { id: 0, key: 'home', title: 'The week, by role', short: 'Week', group: 'Overview' },
  { id: 1, key: 'signals', title: 'Signal capture', short: 'Signals', group: 'Signals and managers' },
  { id: 2, key: 'managers', title: 'Manager pipeline', short: 'Managers', group: 'Signals and managers' },
  { id: 3, key: 'dd', title: 'Fund diligence', short: 'Diligence', group: 'Signals and managers' },
  { id: 4, key: 'portfolio', title: 'Monitor, two layers', short: 'Monitor', group: 'Portfolio and LPs' },
  { id: 5, key: 'letter', title: 'LP letter', short: 'Letter', group: 'Portfolio and LPs' },
  { id: 6, key: 'lpqa', title: 'LP questions', short: 'LP Q&A', group: 'Portfolio and LPs' },
  { id: 7, key: 'ops', title: 'Fund operations', short: 'Ops', group: 'Portfolio and LPs' },
  { id: 8, key: 'pipeline', title: 'Startup pipeline', short: 'Startups', group: 'Portfolio and LPs' },
  { id: 9, key: 'harness', title: 'What Scribe may do', short: 'Rules', group: 'Trust' },
  { id: 10, key: 'readout', title: 'Friday read-out', short: 'Read-out', group: 'Trust' },
  { id: 11, key: 'roadmap', title: 'The two months', short: 'Roadmap', group: 'Trust' },
];
export const SCREEN_GROUPS = ['Overview', 'Signals and managers', 'Portfolio and LPs', 'Trust'] as const;

export const SUGGESTIONS: Record<number, string[]> = {
  0: ['Give me the Monday brief', 'What do we know about Meridian Ridge Partners?', 'Which managers are overdue on their Q3 report?'],
  1: ['What do we know about Meridian Ridge Partners?', 'Use a sample email', 'Use a sample voice memo'],
  2: ['Prepare the reference call for Meridian Ridge', 'Which managers are above the bar?'],
  3: ['Why is the Fund I TVPI claim contradicted?', 'Prepare the reference call for Meridian Ridge'],
  4: ['Why is Harbor Peak Ventures flagged?', 'Which managers are overdue on their Q3 report?'],
  5: ['Draft the manager developments paragraph for the LP letter', 'Where does the NAV figure come from?'],
  6: ['What is our look-through exposure to AI-native companies?', 'Who is raising a successor fund?'],
  7: ['Check the Northwind capital call notice', 'Send the note to Northwind now'],
  8: ['What is open in the co-invest pipeline?'],
  9: ['What can you do, and what can you never do?', 'Pause Scribe'],
  10: ['Give me the Monday brief', 'What happens on day 60?'],
  11: ['What happens on day 60?'],
};

export const RECENT_SEED = [
  { id: 'r1', title: 'Monday brief, 2 Nov', when: 'Today' },
  { id: 'r2', title: 'Saltmarsh key-person change', when: 'Fri' },
  { id: 'r3', title: 'Harbor Peak Q3, chart values', when: 'Wed' },
  { id: 'r4', title: 'LP A look-through question', when: 'Thu' },
];
