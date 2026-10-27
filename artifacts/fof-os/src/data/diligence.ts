export type ClaimStatus = 'ver' | 'unv' | 'con';
export interface Claim { c: string; s: ClaimStatus; src: string }

export const DILIGENCE = {
  manager: 'Meridian Ridge Partners, Fund II',
  docs: [
    'Fund II PPM (42 pp)', 'Fund I schedule of investments (xlsx, 14 lines)', 'Fund I quarterly reports, Q1 to Q3 2026', 'Fund I audited accounts FY2025',
    'LPA draft, Fund II', 'DDQ v2', 'Team bios and public profile snapshots', 'Reference notes (3 calls)', 'Chart photo, 2 Nov (indicative)',
  ],
  sections: [
    { t: 'Team', claims: [
      { c: 'Three general partners, all full-time', s: 'con', src: 'DDQ v2 p.12 lists two full-time GPs; bios name the third as venture partner' },
      { c: 'Priya Natarajan led 9 of 14 Fund I investments', s: 'ver', src: 'Schedule of investments, attribution column' },
      { c: 'No GP departures since inception', s: 'ver', src: 'Audited accounts FY2025 note 2; DDQ p.13' },
    ] },
    { t: 'Track record', claims: [
      { c: 'Fund I TVPI 1.9x', s: 'con', src: 'Recomputed from the schedule and FY2025 accounts: gross 1.85x, net 1.62x; Q3 report p.4 states 1.62x net' },
      { c: 'Two exits returning 0.11x DPI', s: 'ver', src: 'Schedule lines 4 and 9; distributions in Q2 and Q3 reports' },
      { c: 'Top quartile against the vintage benchmark', s: 'unv', src: 'Benchmark source not provided; cannot verify' },
    ] },
    { t: 'Strategy', claims: [
      { c: 'Average first check $600k', s: 'ver', src: 'Schedule: median $580k, mean $610k' },
      { c: 'Average entry ownership 8%', s: 'unv', src: 'Cap tables present for 9 of 14 companies; 7.1% on those' },
      { c: 'Fund II: same strategy, larger reserves (45%)', s: 'ver', src: 'PPM p.9 against Fund I deployment (reserves 38%)' },
    ] },
    { t: 'Terms', claims: [
      { c: 'Management fee 2%, carry 20%, 8% hurdle', s: 'ver', src: 'LPA draft section 6' },
      { c: 'GP commitment 2%', s: 'ver', src: 'LPA draft section 3' },
      { c: 'Key-person clause covers both GPs', s: 'con', src: 'LPA draft section 11 names Priya Natarajan only' },
    ] },
    { t: 'LP base', claims: [
      { c: 'Anchor LP soft-circled at $15m', s: 'unv', src: 'Email of 2 Nov only; no written indication in the data room (voice memo of today says signed indication: to confirm)' },
      { c: '70% of Fund I LPs re-committing', s: 'unv', src: 'Founder statement on call 2; no LP list with status' },
    ] },
    { t: 'Operations', claims: [
      { c: 'Audited accounts FY2025, clean opinion', s: 'ver', src: "Audited accounts FY2025, auditor's report" },
      { c: 'Independent fund administrator in place', s: 'ver', src: 'DDQ v2 p.21; administrator letter' },
    ] },
  ] as { t: string; claims: Claim[] }[],
  // position, cost $m, value $m, realised $m, status
  track: [
    ['Company A (B2B software)', 0.8, 2.4, 0, 'active'],
    ['Company B (data infrastructure)', 0.7, 1.9, 0, 'active'],
    ['Company C (fintech)', 0.9, 0.0, 1.6, 'exited'],
    ['Company D (health software)', 0.8, 1.1, 0, 'active'],
    ['Company E (devtools)', 0.7, 0.9, 0, 'active'],
    ['Company F (marketplace)', 0.8, 0.0, 0.4, 'exited (partial)'],
    ['Eight other positions', 5.4, 6.0, 0, 'active'],
  ] as [string, number, number, number, string][],
  feeDrag: { mgmt: 1.6, carry: 0.7 },
};

export const CLAIM_LABEL: Record<ClaimStatus, string> = { ver: 'Verified', unv: 'Unverified', con: 'Contradicted' };
