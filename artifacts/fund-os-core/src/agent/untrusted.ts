export const injectionPatterns = [
  /ignore\s+(all\s+)?(previous|prior|system)\s+instructions/i,
  /(?:send|delete|archive|sign)\s+(?:all|the|this|an?)\s/i,
  /(?:system|developer)\s*:\s/i,
  /(?:reveal|exfiltrate|upload).{0,25}(?:secret|key|token|credentials)/i,
  /(?:override|bypass).{0,30}(?:guard|permission|approval|policy)/i,
  /(?:promote|increase).{0,20}autonomy/i,
];
export function detectInstructions(text: string) {
  return { flagged: injectionPatterns.some(pattern => pattern.test(text)), detector: "deterministic-pattern-classifier/v1" };
}
export function encloseUntrusted(text: string, provenance: unknown) {
  return { kind: "untrusted_source_data" as const, provenance, content: text };
}
