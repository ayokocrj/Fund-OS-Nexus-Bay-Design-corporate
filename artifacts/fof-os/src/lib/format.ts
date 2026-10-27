export const fmtM = (m: number): string => {
  const s = m >= 100 ? m.toFixed(0) : m >= 10 ? m.toFixed(1) : m.toFixed(2);
  return '$' + s.replace(/\.?0+$/, '') + 'm';
};
export const fmtK = (k: number): string =>
  k >= 1000 ? '$' + (k / 1000).toFixed(k >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'm' : '$' + Math.round(k) + 'k';
export const pct = (v: number, d = 0): string => (v * 100).toFixed(d) + '%';
export const mult = (v: number): string => v.toFixed(2) + 'x';
export function median(a: number[]): number {
  const s = a.slice().sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
export function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, '0');
}
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const TODAY = 'Monday 2 November 2026';
export const DEMO_NOTE = 'Synthetic data: managers, companies, people and figures are invented.';
