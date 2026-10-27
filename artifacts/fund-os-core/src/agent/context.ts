import { db, type Actor } from "../domain/db";
import { encloseUntrusted, detectInstructions } from "./untrusted";
import { assessAnswer, type Answer } from "./critic";
export type EpisodeContext = {
  version: 2; firmId: string; orgId: string; orgName: string; intent: "ask" | "draft";
  facts: { field: string; value: unknown; obs_id: string }[];
  sources: { id: string; content: string; locator: unknown; document?: string; conversation?: string }[];
};
export async function captureContext(actor: Actor, orgId: string, intent: "ask" | "draft"): Promise<EpisodeContext> {
  const org = await db.organisation.findFirstOrThrow({ where: { org_id: orgId, firm_id: actor.firmId } });
  const facts = await db.organisationFact.findMany({ where: { org_id: orgId, valid_to: null }, orderBy: { field: "asc" } });
  const docs = await db.document.findMany({ where: { firm_id: actor.firmId, owner_type: "Organisation", owner_id: orgId } });
  const observations = await db.observation.findMany({ where: { doc_id: { in: docs.map(doc => doc.doc_id) } }, orderBy: { obs_id: "asc" } });
  if (facts.some(fact => !observations.some(obs => obs.obs_id === fact.obs_id))) throw new Error("FACT_SOURCE_SCOPE");
  return { version: 2, firmId: actor.firmId, orgId, orgName: org.legal_name, intent,
    facts: facts.map(({ field, value, obs_id }) => ({ field, value, obs_id })),
    sources: observations.map(obs => ({ id: obs.obs_id, content: obs.text, locator: obs.locator_json, ...(obs.doc_id ? { document: obs.doc_id } : {}), ...(obs.conv_id ? { conversation: obs.conv_id } : {}) })),
  };
}
export const flaggedContext = (ctx: EpisodeContext) => ctx.sources.some(source => detectInstructions(source.content).flagged);
export function answerFromContext(ctx: EpisodeContext) {
  const citations = ctx.facts.map(fact => fact.obs_id);
  return {
    orgId: ctx.orgId, orgName: ctx.orgName,
    text: ctx.facts.length ? ctx.facts.map(fact => typeof fact.value === "string" ? fact.value : JSON.stringify(fact.value)).join("\n") : "Not in the record.",
    citations,
    sources: ctx.sources.filter(source => citations.includes(source.id)).map(source => ({
      ...source, data: encloseUntrusted(source.content, { observation: source.id, locator: source.locator, document: source.document ?? null, conversation: source.conversation ?? null }),
    })),
  };
}
export function perceiveContext(ctx: EpisodeContext) {
  return { organisation: ctx.orgId, synthetic: true, sourceFlagged: flaggedContext(ctx), sources: ctx.sources.map(source => encloseUntrusted(source.content, { observation: source.id, document: source.document ?? null, locator: source.locator })) };
}
export const resolveContext = (ctx: EpisodeContext) => ({ firm: ctx.firmId, organisation: ctx.orgName });
export const criticFromContext = (ctx: EpisodeContext, answer: Answer) => assessAnswer(answer, ctx.sources.filter(source => answer.citations.includes(source.id)).map(source => ({ id: source.id, content: source.content, authorized: true })), flaggedContext(ctx));
