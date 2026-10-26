import { db, type Actor } from "../domain/db";
import { detectInstructions } from "./untrusted";
export type Answer = { text: string; citations: string[] };
export async function critic(actor: Actor, answer: Answer) {
  const reasons: string[] = [];
  if (/(?:recommend (?:invest|buy|sell)|should invest|valuation|term sheet|legal advice|I (?:sent|signed|deleted)|wire funds)/i.test(answer.text)) reasons.push("PROHIBITED_OUTPUT");
  if (answer.text === "Not in the record." && answer.citations.length === 0) return { passed: true, reasons: [] };
  const sources = await db.observation.findMany({ where: { obs_id: { in: answer.citations } } });
  if (!sources.length || sources.length !== new Set(answer.citations).size) reasons.push("MISSING_SOURCE");
  const documents = await db.document.findMany({ where: { doc_id: { in: sources.flatMap(x => x.doc_id ? [x.doc_id] : []) }, firm_id: actor.firmId } });
  const conversations = await db.conversation.findMany({ where: { conv_id: { in: sources.flatMap(x => x.conv_id ? [x.conv_id] : []) }, firm_id: actor.firmId } });
  for (const source of sources) {
    if (!(documents.some(d => d.doc_id === source.doc_id) || conversations.some(c => c.conv_id === source.conv_id))) reasons.push("SOURCE_SCOPE");
    if (detectInstructions(source.text).flagged) reasons.push("INSTRUCTION_IN_SOURCE");
  }
  // Phase 0 deliberately uses extractive drafts. Do not treat a valid citation
  // ID as proof that it supports a paraphrase or a new numerical assertion.
  const statements = answer.text.split("\n").filter(Boolean);
  if (statements.some(statement => !sources.some(source => source.text.includes(statement)))) reasons.push("UNSUPPORTED_STATEMENT");
  return { passed: reasons.length === 0, reasons: [...new Set(reasons)] };
}
