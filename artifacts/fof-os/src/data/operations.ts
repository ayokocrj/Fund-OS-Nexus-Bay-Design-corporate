export interface CapitalCall { mgr: string; call: string; lpaDays: number; given: number; expected: number; notice: number; ok: boolean; cause: string }
export const CAPITAL_CALLS: CapitalCall[] = [
  { mgr: 'm04', call: 'Call 6', lpaDays: 10, given: 7, expected: 400, notice: 412, ok: false, cause: 'Notice period short of the LPA; amount 3% above our commitment share of the call' },
  { mgr: 'm05', call: 'Call 3', lpaDays: 10, given: 12, expected: 225, notice: 225, ok: true, cause: '' },
  { mgr: 'm10', call: 'Call 11', lpaDays: 15, given: 16, expected: 0, notice: 0, ok: true, cause: 'Fully called; notice is a fee-only call, ties to the LPA' },
  { mgr: 'm08', call: 'Call 7', lpaDays: 10, given: 11, expected: 350, notice: 350, ok: true, cause: '' },
];
export const DOCS_MISSING: [string, string, string, number][] = [
  ['m13', 'Audited accounts FY2025', '31 Jul', 94],
  ['m03', 'Q3 2026 quarterly report', '30 Oct', 3],
  ['m11', 'Portfolio company list, Q3', '30 Oct', 3],
  ['m05', 'Portfolio company list, Q3', '14 Nov', 0],
];
export const KYC: [string, string][] = [
  ['Meridian Ridge Partners, Fund II (onboarding)', 'pending: UBO register extract'],
  ['Westbrook Operators Fund I', 'pending: not started'],
  ['Kestrel Point, Fund III', 'complete'],
  ['Bluefern Ventures, Fund II', 'complete'],
];
// item, days left, preparation %
export const REG_CALENDAR: [string, number, number][] = [
  ['Annual LP report and audited accounts', 58, 45],
  ['Form ADV annual amendment', 120, 20],
  ['Valuation committee, Q3 marks', 11, 85],
  ['AML periodic review', 34, 70],
];

export interface Deal { id: string; co: string; round: string; via: string; lead: string; alloc: number; score: number; gaps: string[]; by: string }
export const DEALS: Deal[] = [
  { id: 'd1', co: 'Nimbus Ledger', round: 'Series B, $40m', via: 'Bluefern Ventures', lead: 'Growth fund, named', alloc: 1.5, score: 82, gaps: ['Information rights at our ticket size'], by: '20 Nov' },
  { id: 'd2', co: 'Quillio Health', round: 'Series B extension, $12m', via: 'Lantern Hill Partners', lead: 'Existing investor', alloc: 1.0, score: 68, gaps: ['Runway 9.7 months: bridge or priced round?', 'Lead terms not shared'], by: '30 Nov' },
  { id: 'd3', co: 'Ferrous AI', round: 'Seed extension, $4m', via: 'Granite Fork Ventures', lead: 'Granite Fork', alloc: 0.5, score: 54, gaps: ['Below our $1m direct floor', 'Paying usage: 4 customers'], by: '15 Nov' },
  { id: 'd4', co: 'Orbital Freight', round: 'Insider bridge, $2m', via: 'Northwind Seed', lead: 'Insiders', alloc: 0.3, score: 41, gaps: ['Runway 6.2 months; plan to profitability not shared', 'Our policy: no bridges without a lead'], by: '10 Nov' },
  { id: 'd5', co: 'Stackhaven', round: 'Series B, $30m', via: 'Tidewater Labs Fund', lead: 'Not yet', alloc: 2.0, score: 61, gaps: ['No lead yet', 'Concentration: Tidewater top position'], by: 'Dec' },
  { id: 'd6', co: 'Veldt Robotics (new)', round: 'Series A, $18m', via: 'Kestrel Point', lead: 'Named', alloc: 1.0, score: 73, gaps: ['Not in a manager we back directly; co-invest policy requires one'], by: '25 Nov' },
];
