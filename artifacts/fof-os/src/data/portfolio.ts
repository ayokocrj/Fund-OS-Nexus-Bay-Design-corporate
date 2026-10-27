import { fmtM, median, mulberry32, mult, pct } from '@/lib/format';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';
export type ReportStatus =
  | { st: 'received'; day: number }
  | { st: 'overdue'; days: number; lpa: number }
  | { st: 'expected'; due: string };

interface ManagerRaw {
  id: string; name: string; fund: string; vint: number; strat: string; size: number; commit: number; called: number;
  tvpiRep: number; tvpiComp?: number; dpi: number; irr: number | null; gp: string; rep: ReportStatus; last: string; top: number;
  note: string; callIssue?: boolean; distPending?: boolean; keyperson?: boolean; docsMissing?: boolean;
}

const RAW: ManagerRaw[] = [
  { id: 'm01', name: 'Meridian Ridge Partners', fund: 'Fund I', vint: 2022, strat: 'Pre-seed and seed, B2B software, US', size: 45, commit: 4, called: 0.71, tvpiRep: 1.62, dpi: 0.11, irr: 21.4, gp: 'Priya Natarajan', rep: { st: 'received', day: 21 }, last: 'Email, 2 Nov (to confirm)', top: 0.22, note: 'Fund II in diligence' },
  { id: 'm02', name: 'Harbor Peak Ventures', fund: 'Fund II', vint: 2021, strat: 'Seed, fintech and infrastructure', size: 80, commit: 5, called: 0.84, tvpiRep: 1.52, tvpiComp: 1.44, dpi: 0.18, irr: 15.9, gp: 'Marcus Oyelaran', rep: { st: 'received', day: 28 }, last: 'Call, 3 Oct', top: 0.19, note: 'Fund III planned 2027' },
  { id: 'm03', name: 'Coral Bend Capital', fund: 'Fund I', vint: 2023, strat: 'Consumer and marketplaces', size: 35, commit: 3, called: 0.52, tvpiRep: 1.08, dpi: 0, irr: 6.1, gp: 'Elena Sorescu', rep: { st: 'overdue', days: 3, lpa: 30 }, last: 'Email, 14 Jul', top: 0.17, note: 'No call since July' },
  { id: 'm04', name: 'Northwind Seed', fund: 'Fund III', vint: 2020, strat: 'Pre-seed generalist', size: 70, commit: 6, called: 0.93, tvpiRep: 1.71, dpi: 0.42, irr: 19.8, gp: 'Tom Achebe', rep: { st: 'received', day: 25 }, last: 'Capital call notice, 29 Oct', top: 0.14, callIssue: true, note: '' },
  { id: 'm05', name: 'Granite Fork Ventures', fund: 'Fund I', vint: 2024, strat: 'Deep tech and industrial software', size: 40, commit: 3, called: 0.31, tvpiRep: 1.02, dpi: 0, irr: null, gp: 'Hanna Lindqvist', rep: { st: 'expected', due: '14 Nov' }, last: 'Call, 9 Oct', top: 0.26, note: 'First reporting cycle' },
  { id: 'm06', name: 'Lantern Hill Partners', fund: 'Fund II', vint: 2021, strat: 'Healthcare and bio software', size: 60, commit: 4, called: 0.88, tvpiRep: 1.35, dpi: 0.26, irr: 11.2, gp: 'Yusuf Demir', rep: { st: 'received', day: 19 }, last: 'Distribution notice, 21 Oct', top: 0.21, distPending: true, note: '' },
  { id: 'm07', name: 'Saltmarsh Capital', fund: 'Fund I', vint: 2022, strat: 'Climate and energy software', size: 50, commit: 3.5, called: 0.66, tvpiRep: 1.21, dpi: 0.04, irr: 9.7, gp: 'Daniel Reyes-Kahn, Ana Ferreira', rep: { st: 'received', day: 24 }, last: 'Call, 30 Oct', top: 0.18, keyperson: true, note: '' },
  { id: 'm08', name: 'Bluefern Ventures', fund: 'Fund II', vint: 2022, strat: 'Seed, AI infrastructure', size: 65, commit: 5, called: 0.74, tvpiRep: 1.88, dpi: 0.09, irr: 27.3, gp: 'Grace Whitfield', rep: { st: 'received', day: 17 }, last: 'Email, 27 Oct (co-invest)', top: 0.24, note: '' },
  { id: 'm09', name: 'Tidewater Labs Fund', fund: 'Fund I', vint: 2023, strat: 'Developer tools', size: 30, commit: 2.5, called: 0.58, tvpiRep: 1.44, dpi: 0, irr: 18.0, gp: 'Kenji Mori', rep: { st: 'received', day: 22 }, last: 'LP update call, 15 Oct', top: 0.38, note: '' },
  { id: 'm10', name: 'Kestrel Point', fund: 'Fund III', vint: 2019, strat: 'Seed, B2B software', size: 90, commit: 5, called: 1.0, tvpiRep: 2.04, dpi: 0.71, irr: 23.5, gp: 'Laila Haddad', rep: { st: 'received', day: 15 }, last: 'LP day, 8 Oct', top: 0.16, note: 'Fund IV conversations started' },
  { id: 'm11', name: 'Ironvale Collective', fund: 'Fund I', vint: 2024, strat: 'Operator-led seed', size: 20, commit: 2, called: 0.4, tvpiRep: 1.0, dpi: 0, irr: null, gp: 'Samuel Osei', rep: { st: 'expected', due: '14 Nov' }, last: 'Email, 1 Oct', top: 0.2, note: 'First reporting cycle' },
  { id: 'm12', name: 'Pinecrest Early', fund: 'Fund II', vint: 2023, strat: 'Consumer health', size: 45, commit: 3, called: 0.49, tvpiRep: 1.12, dpi: 0, irr: 7.4, gp: 'Mei Tanaka', rep: { st: 'received', day: 27 }, last: 'Email, 26 Oct', top: 0.15, note: '' },
  { id: 'm13', name: 'Driftline Ventures', fund: 'Fund I', vint: 2022, strat: 'Vertical SaaS', size: 40, commit: 3, called: 0.69, tvpiRep: 1.29, dpi: 0.05, irr: 10.8, gp: 'Noah Brightwater', rep: { st: 'received', day: 26 }, last: 'Email, 25 Oct', top: 0.13, docsMissing: true, note: '' },
  { id: 'm14', name: 'Basalt Row Capital', fund: 'Fund II', vint: 2020, strat: 'Fintech', size: 75, commit: 4.5, called: 0.95, tvpiRep: 1.58, dpi: 0.33, irr: 14.6, gp: 'Ines Carvalho', rep: { st: 'received', day: 20 }, last: 'Call, 20 Oct', top: 0.17, note: '' },
];

export interface Manager extends ManagerRaw {
  paidIn: number; total: number; dist: number; nav: number; tvpiComp: number; hist: number[]; vgroup: string;
}

export const MANAGERS: Manager[] = RAW.map((m, i) => {
  const paidIn = m.commit * m.called;
  const tvpiComp = m.tvpiComp ?? m.tvpiRep;
  const total = tvpiComp * paidIn;
  const dist = m.dpi * paidIn;
  const nav = total - dist;
  const r = mulberry32(500 + i * 13);
  const hist: number[] = [];
  let v = nav / Math.pow(1.045, 5);
  for (let k = 0; k < 6; k++) { hist.push(+v.toFixed(2)); v *= 1 + 0.02 + r() * 0.06; }
  hist[5] = +nav.toFixed(2);
  const vgroup = m.vint <= 2021 ? '2019 to 2021' : m.vint <= 2023 ? '2022 to 2023' : '2024 and later';
  return { ...m, paidIn, total, dist, nav, tvpiComp, hist, vgroup };
});

export const getManager = (id: string) => MANAGERS.find((m) => m.id === id)!;

export interface Flag { k: string; s: string; t: string; tone: Tone }

export function managerFlags(m: Manager): Flag[] {
  const f: Flag[] = [];
  if (Math.abs(m.tvpiComp - m.tvpiRep) >= 0.03) f.push({ k: 'tvpi', s: 'TVPI mismatch', t: `TVPI headline ${mult(m.tvpiRep)} vs components ${mult(m.tvpiComp)}`, tone: 'bad' });
  if (m.rep.st === 'overdue') f.push({ k: 'overdue', s: 'Report overdue', t: `Q3 report overdue ${m.rep.days} days (LPA: ${m.rep.lpa} days)`, tone: 'warn' });
  if (m.keyperson) f.push({ k: 'key', s: 'Key person', t: 'Key person: GP stepping back (call note), not in the report', tone: 'bad' });
  if (m.top >= 0.3) f.push({ k: 'conc', s: 'Concentration', t: `Top position ${pct(m.top)} of NAV (policy: 30%)`, tone: 'warn' });
  if (m.docsMissing) f.push({ k: 'docs', s: 'Docs missing', t: 'FY2025 audited accounts missing', tone: 'warn' });
  if (m.distPending) f.push({ k: 'dist', s: 'Distribution pending', t: `Distribution notice ${fmtM(0.4)}, cash not received (12 days)`, tone: 'warn' });
  if (m.callIssue) f.push({ k: 'call', s: 'Call notice', t: 'Capital call: 7 days notice vs 10 in LPA; amount above expected', tone: 'bad' });
  if (m.id === 'm03') f.push({ k: 'silent', s: 'No contact', t: 'No conversation since July', tone: 'warn' });
  return f;
}

export const FLAG_ADVICE: Record<string, string> = {
  tvpi: "Question drafted for the manager's IR contact, held for you.",
  overdue: 'Reminder drafted, held in your drafts.',
  key: 'Key-person clause to re-read; call with the GP suggested.',
  conc: 'Note for the next LP letter; policy exception to record or not.',
  docs: 'Document request drafted, held.',
  dist: 'Administrator asked to confirm receipt; note held.',
  call: "Note to the manager's administrator drafted, held.",
  silent: 'Check-in call suggested; nothing sent.',
  update: 'Reminder drafted to the founder, held for you.',
  runway: 'Bridge or raise conversation within the quarter; the introducing manager is copied on the draft.',
  growth: 'Ask the manager for context at the next catch-up.',
};

export const VINTAGE_MEDIANS = (() => {
  const by: Record<string, Manager[]> = {};
  MANAGERS.forEach((m) => { (by[m.vgroup] ||= []).push(m); });
  return Object.keys(by).sort().map((g) => {
    const a = by[g];
    return { group: g, n: a.length, tvpi: median(a.map((x) => x.tvpiRep)), dpi: median(a.map((x) => x.dpi)), called: median(a.map((x) => x.called)) };
  });
})();

export interface Company {
  id: string; name: string; stage: string; sector: string; via: string; arr: number; growth: number; burn: number; cash: number;
  runway: number; update: { st: 'received'; day: number } | { st: 'missing'; late: number }; hist: number[];
}

const COS_RAW: [string, string, string, string, string, number, number, number, number, Company['update']][] = [
  ['co1', 'Lumenport', 'Seed', 'Fintech infrastructure', 'm02', 1800, 0.06, 160, 2400, { st: 'received', day: 4 }],
  ['co2', 'Stackhaven', 'Series A', 'Developer tools', 'm09', 4200, 0.04, 380, 6100, { st: 'received', day: 6 }],
  ['co3', 'Quillio Health', 'Series A', 'Health software', 'm06', 3100, 0.05, 300, 2900, { st: 'received', day: 8 }],
  ['co4', 'Orbital Freight', 'Seed', 'Logistics software', 'm04', 900, 0.03, 210, 1300, { st: 'received', day: 5 }],
  ['co5', 'Nimbus Ledger', 'Series A', 'Fintech', 'm02', 5600, 0.07, 420, 9800, { st: 'received', day: 3 }],
  ['co6', 'Parcelwise', 'Seed', 'Commerce operations', 'm03', 1100, 0.003, 140, 2000, { st: 'received', day: 9 }],
  ['co7', 'Ferrous AI', 'Seed', 'Industrial AI', 'm05', 400, 0.12, 180, 3200, { st: 'received', day: 7 }],
  ['co8', 'Halo Kitchens', 'Series A', 'Food operations', 'm12', 2700, 0.02, 260, 3300, { st: 'missing', late: 16 }],
];

export const COMPANIES: Company[] = COS_RAW.map((c, i) => {
  const r = mulberry32(900 + i * 7);
  const hist: number[] = [];
  let v = c[5] / Math.pow(1 + c[6], 6);
  for (let k = 0; k < 7; k++) { hist.push(Math.round(v)); v *= 1 + c[6] * (0.8 + r() * 0.4); }
  hist[6] = c[5];
  if (c[0] === 'co6') { hist[5] = Math.round(hist[4] * 1.004); hist[6] = Math.round(hist[5] * 1.003); }
  return { id: c[0], name: c[1], stage: c[2], sector: c[3], via: c[4], arr: c[5], growth: c[6], burn: c[7], cash: c[8], runway: c[8] / c[7], update: c[9], hist };
});
export const getCompany = (id: string) => COMPANIES.find((c) => c.id === id)!;

export function companyFlags(c: Company): Flag[] {
  const f: Flag[] = [];
  if (c.update.st === 'missing') f.push({ k: 'update', s: 'No update', t: `No update for ${c.update.late} days`, tone: 'bad' });
  if (c.runway < 9) f.push({ k: 'runway', s: 'Runway', t: `Runway ${c.runway.toFixed(1)} months`, tone: 'bad' });
  if (c.growth < 0.01) f.push({ k: 'growth', s: 'Flat', t: 'Growth flat two months', tone: 'warn' });
  return f;
}

export const HARBOR_CHART_VALUES = [
  { k: 'a', label: 'Gross IRR', value: '18.3%', loc: 'chart p.6' },
  { k: 'b', label: 'Fintech share of unrealised value', value: '61%', loc: 'chart p.7' },
  { k: 'c', label: 'Active companies', value: '23', loc: 'chart p.8' },
];

export const totals = {
  nav: MANAGERS.reduce((s, m) => s + m.nav, 0),
  paidIn: MANAGERS.reduce((s, m) => s + m.paidIn, 0),
  commit: MANAGERS.reduce((s, m) => s + m.commit, 0),
  dist: MANAGERS.reduce((s, m) => s + m.dist, 0),
};
