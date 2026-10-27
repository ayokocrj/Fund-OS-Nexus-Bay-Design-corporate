export const CRITERIA_VERSION = 'v1.0 (week-one workshop)';
export const CRITERIA = [
  { k: 'track', label: 'Track record documented and attributable', max: 25 },
  { k: 'consist', label: 'Strategy consistent with past deployment', max: 20 },
  { k: 'size', label: 'Fund size fits stage and team', max: 15 },
  { k: 'terms', label: 'Terms within our ranges', max: 15 },
  { k: 'refs', label: 'References available (LPs, founders, co-investors)', max: 15 },
  { k: 'edge', label: 'Access or sourcing edge evidenced', max: 10 },
] as const;

type Why = Record<'track' | 'consist' | 'size' | 'terms' | 'refs' | 'edge', string>;
export interface Prospect {
  id: string; name: string; gp: string; target: number; stage: string; status: string;
  track: 'attributed' | 'documented' | 'angel_partial' | 'none'; consist: 'consistent' | 'drift' | 'na';
  size: 'fit' | 'large' | 'small'; terms: 'within' | 'above' | 'unknown'; refs: 'available' | 'partial' | 'none';
  edge: 'evidenced' | 'claimed'; ask: number; src: string; recv: string; why: Why;
}

export const PROSPECTS: Prospect[] = [
  { id: 'p01', name: 'Meridian Ridge Partners, Fund II', gp: 'Priya Natarajan', target: 75, stage: 'Pre-seed and seed, B2B software', status: 'Diligence, data room open', track: 'attributed', consist: 'consistent', size: 'fit', terms: 'within', refs: 'available', edge: 'evidenced', ask: 5, src: 'Existing manager (Fund I)', recv: 'Data room 20 Oct',
    why: { track: 'Schedule of 14 investments with an attribution column; FY2025 audited accounts', consist: 'Fund II PPM p.9 mirrors Fund I deployment (median first check $580k)', size: '$75m for two GPs at pre-seed and seed; reserves 45%', terms: '2% / 20% / 8% hurdle, GP commit 2% (LPA draft s.6)', refs: 'Two Fund I LPs and four founders offered', edge: 'Sourcing log of 410 companies seen in 2025, 31% via operator network' } },
  { id: 'p02', name: 'Alder Street Ventures, Fund I', gp: 'Jonah Feld', target: 40, stage: 'Pre-seed generalist', status: 'First call done', track: 'angel_partial', consist: 'na', size: 'fit', terms: 'unknown', refs: 'partial', edge: 'claimed', ask: 3, src: 'Intro by Kestrel Point GP', recv: 'Call 21 Oct',
    why: { track: 'Angel track record: 11 investments, 3 marked up, no audited figures', consist: 'First institutional fund; no deployment history to compare', size: '$40m for a solo GP plus one principal', terms: 'Term sheet not yet shared', refs: 'Three founders offered, no LP references yet', edge: 'Claims access to a university spin-out programme; no evidence yet' } },
  { id: 'p03', name: 'Copperline Seed, Fund II', gp: 'Rhea Kapoor', target: 60, stage: 'Seed, fintech', status: 'Screening', track: 'documented', consist: 'drift', size: 'large', terms: 'within', refs: 'available', edge: 'evidenced', ask: 4, src: 'Inbound email', recv: 'Deck 24 Oct',
    why: { track: 'Fund I schedule provided, no attribution per partner', consist: 'Fund I deployed 40% at Series A despite a seed mandate', size: '$60m, 2.4x Fund I; team unchanged', terms: '2% / 20%, GP commit 1.5%', refs: 'LP list shared', edge: 'Fintech operator network, documented in deck p.7' } },
  { id: 'p04', name: 'Westbrook Operators Fund I', gp: 'Caleb Moreau', target: 25, stage: 'Operator-led seed', status: 'Screening', track: 'none', consist: 'na', size: 'fit', terms: 'above', refs: 'partial', edge: 'evidenced', ask: 2, src: 'Conference', recv: 'Deck 27 Oct',
    why: { track: 'No prior fund or angel schedule', consist: 'First fund', size: '$25m for three part-time operators', terms: '2.5% / 25%, no hurdle (deck p.14)', refs: 'Founders offered, no LPs', edge: 'Operator network at two scaled companies, evidenced by advisory roles' } },
  { id: 'p05', name: 'Juniper Bay Capital, Fund III', gp: 'Sofia Lindgren', target: 120, stage: 'Seed and Series A, climate', status: 'Pass suggested', track: 'attributed', consist: 'consistent', size: 'large', terms: 'within', refs: 'available', edge: 'evidenced', ask: 6, src: 'Placement agent', recv: 'Deck 15 Oct',
    why: { track: 'Funds I and II schedules with attribution', consist: 'Consistent', size: '$120m, above the $20m to $80m range in our manager policy', terms: '2% / 20%', refs: 'Available', edge: 'Documented' } },
  { id: 'p06', name: 'Summit Fold Angels, Fund I', gp: 'Diego Alvarez', target: 15, stage: 'Angel syndicate turned fund', status: 'Keep warm', track: 'angel_partial', consist: 'na', size: 'small', terms: 'unknown', refs: 'none', edge: 'claimed', ask: 1, src: 'Inbound', recv: 'Email 29 Oct',
    why: { track: 'Syndicate deals listed, no schedule', consist: 'First fund', size: '$15m, below our $20m floor', terms: 'Not shared', refs: 'None offered yet', edge: 'Claimed' } },
];

export type Band = 'meet' | 'review' | 'pass';
export interface ScorePart { k: string; label: string; max: number; pts: number; why: string; gap: string }
export interface Score { total: number; parts: ScorePart[]; band: Band; capped: boolean; gaps: string[] }

export function scoreProspect(p: Prospect): Score {
  const P: ScorePart[] = [];
  const add = (i: number, pts: number, gap: string) => {
    const c = CRITERIA[i];
    P.push({ k: c.k, label: c.label, max: c.max, pts, why: p.why[c.k], gap });
  };
  let v = { attributed: 25, documented: 15, angel_partial: 8, none: 0 }[p.track];
  add(0, v, v < 25 ? (v === 0 ? 'No track record to verify; references carry the weight' : 'Attribution per partner or audited figures needed') : '');
  v = { consistent: 20, drift: 8, na: 10 }[p.consist];
  add(1, v, p.consist === 'drift' ? 'Explain the Series A share of Fund I against the seed mandate' : p.consist === 'na' ? 'First fund: deployment plan and pacing to be written down' : '');
  v = { fit: 15, large: 6, small: 5 }[p.size];
  add(2, v, p.size === 'large' ? 'Fund size above our manager policy range' : p.size === 'small' ? 'Fund size below our floor; co-invest route instead?' : '');
  v = { within: 15, above: 4, unknown: 5 }[p.terms];
  add(3, v, p.terms === 'above' ? 'Terms above our ranges; hurdle missing' : p.terms === 'unknown' ? 'Ask for the term sheet' : '');
  v = { available: 15, partial: 8, none: 0 }[p.refs];
  add(4, v, v < 15 ? 'LP references not yet offered' : '');
  v = { evidenced: 10, claimed: 4 }[p.edge];
  add(5, v, v < 10 ? 'Evidence of the claimed access (deal list, intros)' : '');
  let total = P.reduce((s, x) => s + x.pts, 0);
  let capped = false;
  if ((p.size === 'large' || p.size === 'small') && total > 64) { total = 64; capped = true; }
  const band: Band = total >= 80 ? 'meet' : total >= 50 ? 'review' : 'pass';
  return { total, parts: P, band, capped, gaps: P.filter((x) => x.gap).map((x) => x.gap) };
}

export const BAND_COPY: Record<Band, { t: string; s: string }> = {
  meet: { t: 'Advance suggested', s: 'At or above the 80 bar agreed in week one. A partner still decides.' },
  review: { t: 'Partner review', s: 'Between 50 and 79: evidence incomplete; the gaps below are the questions for the next call.' },
  pass: { t: 'Pass suggested', s: 'Below 50. Nothing is archived until a person decides.' },
};
