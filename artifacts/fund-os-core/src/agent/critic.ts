import { db, type Actor } from "../domain/db";
import { detectInstructions } from "./untrusted";
export type Answer = { text: string; citations: string[] };
export const checkNames = ["citations_resolve", "citation_supports_text", "forbidden_content", "injected_instruction", "confidence_language"] as const;
export type CriticVerdict = {
  overall: "pass" | "pass_with_notes" | "block";
  checks: Record<typeof checkNames[number], { status: "pass" | "fail"; note: string }>;
};
export type Evidence = { id: string; content: string; authorized: boolean };
export const isPassing = (value: unknown): value is CriticVerdict => !!value && typeof value === "object" && ["pass", "pass_with_notes"].includes((value as CriticVerdict).overall);
export function assessAnswer(answer: Answer, sources: Evidence[], sourceFlagged = false): CriticVerdict {
  const missing = answer.text === "Not in the record." && answer.citations.length === 0;
  const resolved = missing || (answer.citations.length > 0 && answer.citations.every(id => sources.some(s => s.id === id && s.authorized)));
  const supported = missing || answer.text.split("\n").filter(Boolean).every(line => sources.some(source => source.authorized && source.content.includes(line)));
  const forbidden = /(?:recommend (?:invest|buy|sell)|should invest|valuation|term sheet|legal advice|I (?:sent|signed|deleted)|wire funds)/i.test(answer.text);
  const injected = sourceFlagged || sources.some(s => detectInstructions(s.content).flagged);
  const confident = /(?:guaranteed|definitely|certainly|100%\s+(?:certain|confidence)|risk.free|no\s+risk|without\s+doubt)/i.test(answer.text);
  const entry = (pass: boolean, good: string, bad: string) => ({ status: pass ? "pass" as const : "fail" as const, note: pass ? good : bad });
  const checks = {
    citations_resolve: entry(resolved, missing ? "Explicit missing-record response: no evidence claimed." : "Every citation resolves inside the acting firm's scope.", "At least one citation is missing or outside the acting firm's scope."),
    citation_supports_text: entry(supported, missing ? "No unsupported fact is asserted." : "Each sentence is extractively supported by cited evidence.", "A citation does not support the asserted text or figure."),
    forbidden_content: entry(!forbidden, "No recommendation, valuation, legal term or external-action claim.", "Prohibited recommendation, valuation, legal term or external-action claim."),
    injected_instruction: entry(!injected, "No source-originated instruction was detected or followed.", "Source-originated instruction detected: read-only processing and human review required."),
    confidence_language: entry(!confident, "No unsupported certainty or confidence language.", "Unsupported certainty or confidence language is present."),
  };
  return { overall: Object.values(checks).some(check => check.status === "fail") ? "block" : missing ? "pass_with_notes" : "pass", checks };
}
export async function critic(actor: Actor, answer: Answer, sourceFlagged = false): Promise<CriticVerdict> {
  const sources = await db.observation.findMany({ where: { obs_id: { in: answer.citations } } });
  const documents = await db.document.findMany({ where: { doc_id: { in: sources.flatMap(x => x.doc_id ? [x.doc_id] : []) }, firm_id: actor.firmId } });
  const conversations = await db.conversation.findMany({ where: { conv_id: { in: sources.flatMap(x => x.conv_id ? [x.conv_id] : []) }, firm_id: actor.firmId } });
  return assessAnswer(answer, sources.map(source => ({
    id: source.obs_id, content: source.text,
    authorized: documents.some(d => d.doc_id === source.doc_id) || conversations.some(c => c.conv_id === source.conv_id),
  })), sourceFlagged);
}
